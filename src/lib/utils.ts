import { differenceInDays, format, isValid, parseISO } from "date-fns";

export type JsonObject = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): JsonObject {
  return isRecord(value) ? value : {};
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function getString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

export function getNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

export function daysUntil(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? differenceInDays(parsed, new Date()) : 0;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "TBD";
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : "TBD";
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function getCurrentCheckpoint(checkpoints: Array<{ id: string; date: string }>): string {
  const now = new Date();
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    if (parseISO(checkpoints[i].date) <= now) {
      if (i < checkpoints.length - 1) return checkpoints[i + 1].id;
      return checkpoints[i].id;
    }
  }
  return checkpoints[0]?.id ?? "";
}

export function slugToLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMetricValue(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Complete" : "Not yet";
  if (typeof value === "number") return `${value}${unit ? ` ${unit}` : ""}`;
  return `${getString(value)}${unit ? ` ${unit}` : ""}`.trim();
}

export function valueFromEntry(entry: JsonObject): string | number | boolean | undefined {
  if (typeof entry.valueNumeric === "number" || typeof entry.valueNumeric === "string") return entry.valueNumeric as string | number;
  if (typeof entry.value_numeric === "number" || typeof entry.value_numeric === "string") return entry.value_numeric as string | number;
  if (typeof entry.valueText === "string" && entry.valueText.length > 0) return entry.valueText;
  if (typeof entry.value_text === "string" && entry.value_text.length > 0) return entry.value_text;
  if (typeof entry.valueBoolean === "boolean") return entry.valueBoolean;
  if (typeof entry.value_boolean === "boolean") return entry.value_boolean;
  return undefined;
}

export function dateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function extractCollection<T extends JsonObject>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const record = asRecord(payload);
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }
  return [];
}

export function extractGoalsByPillar(checkpoint: unknown, pillar: string): JsonObject[] {
  const source = asRecord(checkpoint);
  const direct = asArray<JsonObject>(source.goals).filter((goal) => getString(goal.pillar).toLowerCase() === pillar.toLowerCase());
  const pillarBlock = asRecord(asRecord(source.pillars)[pillar]);
  const nested = asArray<JsonObject>(pillarBlock.goals);
  return [...direct, ...nested];
}
