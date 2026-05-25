import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type PlainObject = Record<string, unknown>;

export type ConfigCheckpoint = PlainObject & {
  id: string;
  date?: string;
};

export type GoalUpdateDiff = {
  path: string;
  previous: unknown;
  next: unknown;
};

const TARGET_KEY_PATTERN = /(target|targets|goal|goals)/i;
const ARRAY_MATCH_KEYS = ["id", "key", "metricKey", "habitKey", "checkpointId", "slug", "name", "title"];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJson(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJson(item)])) as T;
  }

  return value;
}

function toPath(path: string[]): string {
  return path.join(".");
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getArrayItemIdentity(value: unknown): string | number | null {
  if (!isPlainObject(value)) {
    return null;
  }

  for (const key of ARRAY_MATCH_KEYS) {
    const candidate = value[key];
    if (typeof candidate === "string" || typeof candidate === "number") {
      return candidate;
    }
  }

  return null;
}

function mergeTargetArrays(base: unknown[], incoming: unknown[], path: string[], diff: GoalUpdateDiff[]): unknown[] {
  const result = base.map((item) => cloneJson(item));

  for (const incomingItem of incoming) {
    const identity = getArrayItemIdentity(incomingItem);
    if (identity === null) {
      continue;
    }

    const index = result.findIndex((item) => getArrayItemIdentity(item) === identity);
    if (index === -1) {
      continue;
    }

    result[index] = mergeGoalTargetsInternal(result[index], incomingItem, [...path, String(identity)], diff);
  }

  return result;
}

function mergeGoalTargetsInternal(base: unknown, incoming: unknown, path: string[], diff: GoalUpdateDiff[]): unknown {
  if (Array.isArray(base) && Array.isArray(incoming)) {
    return mergeTargetArrays(base, incoming, path, diff);
  }

  if (isPlainObject(base) && isPlainObject(incoming)) {
    const result: PlainObject = cloneJson(base);

    for (const [key, value] of Object.entries(incoming)) {
      const nextPath = [...path, key];
      const currentValue = result[key];

      if (TARGET_KEY_PATTERN.test(key)) {
        if (!sameValue(currentValue, value)) {
          diff.push({
            path: toPath(nextPath),
            previous: currentValue ?? null,
            next: value,
          });
        }
        result[key] = cloneJson(value);
        continue;
      }

      if (Array.isArray(currentValue) && Array.isArray(value)) {
        result[key] = mergeTargetArrays(currentValue, value, nextPath, diff);
        continue;
      }

      if (isPlainObject(currentValue) && isPlainObject(value)) {
        result[key] = mergeGoalTargetsInternal(currentValue, value, nextPath, diff);
      }
    }

    return result;
  }

  return cloneJson(base);
}

export function mergeGoalTargets(existingConfig: unknown, importedConfig: unknown): { data: unknown; diff: GoalUpdateDiff[] } {
  const diff: GoalUpdateDiff[] = [];
  const data = mergeGoalTargetsInternal(existingConfig, importedConfig, [], diff);
  return { data, diff };
}

export function getCheckpointsFromConfig(data: Prisma.JsonValue | null | undefined): ConfigCheckpoint[] {
  if (!isPlainObject(data)) {
    return [];
  }

  const checkpoints = data.checkpoints;
  if (!Array.isArray(checkpoints)) {
    return [];
  }

  return checkpoints
    .filter(isPlainObject)
    .map((checkpoint, index) => {
      const checkpointData = checkpoint as PlainObject;

      return {
        ...checkpointData,
        id: String(checkpointData.id ?? `checkpoint-${index + 1}`),
        date: typeof checkpointData.date === "string" ? checkpointData.date : undefined,
      };
    });
}

export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

export function parseDateTime(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatDateOnly(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): Date {
  return new Date(startOfUtcDay(date).getTime() + days * DAY_IN_MS);
}

export function diffUtcDays(from: Date, to: Date): number {
  return Math.ceil((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / DAY_IN_MS);
}

export function calculateStreaks(logDates: Array<Date | string>): {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
} {
  const uniqueDates = Array.from(
    new Set(
      logDates
        .map((value) => (typeof value === "string" ? value.slice(0, 10) : formatDateOnly(value)))
        .filter(Boolean)
    )
  ).sort();

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
    };
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previousDate = parseDateOnly(uniqueDates[index - 1]);
    const currentDate = parseDateOnly(uniqueDates[index]);

    if (!previousDate || !currentDate) {
      continue;
    }

    if (diffUtcDays(previousDate, currentDate) === 1) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  const today = startOfUtcDay(new Date());
  const yesterday = addUtcDays(today, -1);
  const lastCompletedDate = uniqueDates[uniqueDates.length - 1] ?? null;
  const streakEnd = lastCompletedDate === formatDateOnly(today)
    ? today
    : lastCompletedDate === formatDateOnly(yesterday)
      ? yesterday
      : null;

  let currentStreak = 0;
  if (streakEnd) {
    const dateSet = new Set(uniqueDates);
    let cursor = streakEnd;
    while (dateSet.has(formatDateOnly(cursor))) {
      currentStreak += 1;
      cursor = addUtcDays(cursor, -1);
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
  };
}

export function getCurrentCheckpoint(checkpoints: ConfigCheckpoint[]): ConfigCheckpoint | null {
  if (checkpoints.length === 0) {
    return null;
  }

  const datedCheckpoints = checkpoints
    .filter((checkpoint) => typeof checkpoint.date === "string")
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (datedCheckpoints.length === 0) {
    return checkpoints[0];
  }

  const today = startOfUtcDay(new Date());
  return datedCheckpoints.find((checkpoint) => {
    const checkpointDate = parseDateOnly(checkpoint.date);
    return checkpointDate ? checkpointDate.getTime() >= today.getTime() : false;
  }) ?? datedCheckpoints[datedCheckpoints.length - 1];
}

export function sumEntryValues<T extends { valueNumeric: Prisma.Decimal | number | null | undefined }>(entries: T[]): number {
  return entries.reduce((total, entry) => {
    if (entry.valueNumeric === null || entry.valueNumeric === undefined) {
      return total + 1;
    }

    return total + Number(entry.valueNumeric);
  }, 0);
}

export function jsonError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export type AssessmentValueType = "numeric" | "text" | "time" | "boolean";

export type Assessment = {
  key: string;
  label: string;
  pillar: string;
  category: string;
  unit?: string;
  valueType: AssessmentValueType;
  target?: number | string | null;
  targetDisplay?: string;
  note?: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cpTarget(checkpoints: unknown, checkpointId: string): PlainObject | null {
  if (!isPlainObject(checkpoints)) return null;
  const entry = checkpoints[checkpointId];
  return isPlainObject(entry) ? entry : null;
}

export function getAssessmentsForCheckpoint(
  data: Prisma.JsonValue | null | undefined,
  checkpointId: string,
): Assessment[] {
  if (!isPlainObject(data)) return [];

  const pillarsData = isPlainObject(data.pillars) ? data.pillars : {};
  const assessments: Assessment[] = [];

  // ── Physical ──────────────────────────────────────────────────────────────
  const physical = isPlainObject(pillarsData.physical) ? pillarsData.physical : {};

  // Strength lifts
  const strength = isPlainObject(physical.strength) ? physical.strength : {};
  for (const lift of asArray<PlainObject>(strength.lifts)) {
    const cp = cpTarget(lift.checkpoints, checkpointId);
    if (!cp) continue;
    assessments.push({
      key: String(lift.key ?? ""),
      label: String(lift.label ?? lift.key ?? ""),
      pillar: "physical",
      category: "strength",
      unit: String(lift.unit ?? "kg"),
      valueType: "numeric",
      target: typeof cp.target === "number" ? cp.target : null,
      note: typeof cp.note === "string" ? cp.note : undefined,
    });
  }

  // Bodyweight
  const bodyweight = isPlainObject(physical.bodyweight) ? physical.bodyweight : {};
  const bwCp = cpTarget(bodyweight.checkpoints, checkpointId);
  if (bwCp) {
    assessments.push({
      key: "bodyweight",
      label: "Bodyweight",
      pillar: "physical",
      category: "bodyweight",
      unit: "kg",
      valueType: "numeric",
      target: typeof bwCp.target === "number" ? bwCp.target : null,
    });
  }

  // Endurance – registered races
  const endurance = isPlainObject(physical.endurance) ? physical.endurance : {};
  for (const race of asArray<PlainObject>(endurance.races)) {
    if (race.checkpoint_id !== checkpointId) continue;
    assessments.push({
      key: String(race.key ?? ""),
      label: String(race.label ?? race.key ?? ""),
      pillar: "physical",
      category: "endurance",
      unit: "time",
      valueType: "time",
      target: typeof race.target_seconds === "number" ? race.target_seconds : null,
      targetDisplay: typeof race.target_display === "string" ? race.target_display : undefined,
    });
  }

  // Endurance – self-organised events
  for (const event of asArray<PlainObject>(endurance.self_organized)) {
    if (event.checkpoint_id !== checkpointId) continue;
    assessments.push({
      key: String(event.key ?? ""),
      label: String(event.label ?? event.key ?? ""),
      pillar: "physical",
      category: "endurance",
      unit: "time",
      valueType: typeof event.target_seconds === "number" ? "time" : "text",
      target: typeof event.target_seconds === "number" ? event.target_seconds : null,
      targetDisplay: typeof event.target_display === "string" ? event.target_display : undefined,
    });
  }

  // Mobility tests
  const mobility = isPlainObject(physical.mobility) ? physical.mobility : {};
  for (const test of asArray<PlainObject>(mobility.tests)) {
    const cp = cpTarget(test.checkpoints, checkpointId);
    if (!cp) continue;
    const unit = String(test.unit ?? "");
    assessments.push({
      key: String(test.key ?? ""),
      label: String(test.label ?? test.key ?? ""),
      pillar: "physical",
      category: "mobility",
      unit,
      valueType: unit === "text" ? "text" : "numeric",
      target: (cp.target as number | string | null) ?? null,
      note: typeof cp.note === "string" ? cp.note : undefined,
    });
  }

  // ── Mind ──────────────────────────────────────────────────────────────────
  const mind = isPlainObject(pillarsData.mind) ? pillarsData.mind : {};

  // Product milestones
  for (const product of asArray<PlainObject>(mind.products)) {
    const milestones = asArray<PlainObject>(product.milestones);
    const milestone = milestones.find((m) => m.checkpoint_id === checkpointId);
    if (!milestone) continue;
    assessments.push({
      key: String(product.key ?? ""),
      label: String(product.label ?? product.key ?? ""),
      pillar: "mind",
      category: "products",
      valueType: "boolean",
      targetDisplay: String(milestone.label ?? ""),
      note: String(milestone.label ?? ""),
    });
  }

  // ── Personal ──────────────────────────────────────────────────────────────
  const personal = isPlainObject(pillarsData.personal) ? pillarsData.personal : {};

  // Solo hike
  const hiking = isPlainObject(personal.hiking) ? personal.hiking : {};
  const hikeCp = cpTarget(hiking.checkpoints, checkpointId);
  if (hikeCp) {
    assessments.push({
      key: String(hiking.key ?? "solo_hike"),
      label: String(hiking.label ?? "Solo Hike"),
      pillar: "personal",
      category: "hiking",
      valueType: "boolean",
      target: typeof hikeCp.target === "number" ? hikeCp.target : 1,
      note: "Alone, no headphones",
    });
  }

  return assessments;
}
