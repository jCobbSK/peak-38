export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import {
  calculateStreaks,
  diffUtcDays,
  getCheckpointsFromConfig,
  getCurrentCheckpoint,
  jsonError,
  parseDateOnly,
  startOfUtcDay,
  sumEntryValues,
} from "@/lib/api-utils";

function keywordFilter(keyword: string): Prisma.EntryWhereInput {
  return {
    OR: [
      { metricKey: { contains: keyword, mode: "insensitive" } },
      { category: { contains: keyword, mode: "insensitive" } },
      { pillar: { contains: keyword, mode: "insensitive" } },
      { proofType: { contains: keyword, mode: "insensitive" } },
    ],
  };
}

export async function GET(_request: NextRequest) {
  try {
    const [
      activeConfig,
      latestBodyweightEntry,
      latestStrengthEntry,
      bookEntries,
      paintingEntries,
      hikeEntries,
      journalingLogs,
      latestSelfCheck,
      allEntries,
      allHabitLogs,
    ] = await Promise.all([
      prisma.config.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.entry.findFirst({
        where: {
          OR: [
            { metricKey: { contains: "bodyweight", mode: "insensitive" } },
            { category: { contains: "bodyweight", mode: "insensitive" } },
          ],
        },
        orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
      }),
      prisma.entry.findFirst({
        where: keywordFilter("strength"),
        orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
      }),
      prisma.entry.findMany({
        where: {
          OR: [
            { metricKey: { contains: "book", mode: "insensitive" } },
            { category: { contains: "reading", mode: "insensitive" } },
          ],
        },
        orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
        select: { id: true, metricKey: true, valueNumeric: true, notes: true, entryDate: true },
      }),
      prisma.entry.findMany({
        where: keywordFilter("painting"),
        orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
        select: { id: true, valueNumeric: true, entryDate: true },
      }),
      prisma.entry.findMany({
        where: keywordFilter("hike"),
        orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
        select: { id: true, valueNumeric: true, entryDate: true },
      }),
      prisma.habitLog.findMany({
        where: {
          completed: true,
          habitKey: { contains: "journal", mode: "insensitive" },
        },
        orderBy: { logDate: "asc" },
        select: { logDate: true },
      }),
      prisma.selfCheck.findFirst({
        orderBy: [{ weekDate: "desc" }, { loggedAt: "desc" }],
      }),
      prisma.entry.findMany({
        select: { entryDate: true, pillar: true },
        orderBy: { entryDate: "desc" },
      }),
      prisma.habitLog.findMany({
        where: { completed: true },
        select: { logDate: true, habitKey: true },
        orderBy: { logDate: "desc" },
      }),
    ]);

    const checkpoints = activeConfig ? getCheckpointsFromConfig(activeConfig.data) : [];
    const currentCheckpoint = getCurrentCheckpoint(checkpoints);
    const currentCheckpointDate = currentCheckpoint?.date ? parseDateOnly(currentCheckpoint.date) : null;
    const today = startOfUtcDay(new Date());
    const ironmanDate = parseDateOnly("2028-08-02");

    const nonfictionBooks = bookEntries.filter((entry) => {
      const key = entry.metricKey.toLowerCase();
      const notes = (entry.notes ?? "").toLowerCase();
      return key.includes("nonfiction") || notes.includes("nonfiction");
    });
    const fictionBooks = bookEntries.filter((entry) => {
      const key = entry.metricKey.toLowerCase();
      const notes = (entry.notes ?? "").toLowerCase();
      return key.includes("fiction") && !key.includes("nonfiction") && !notes.includes("nonfiction");
    });

    // Build activity wall data: count activities per day with details
    // Use local date getters because Prisma @db.Date returns dates at local midnight
    const activityMap: Record<string, { count: number; labels: string[] }> = {};
    for (const entry of allEntries) {
      const d = entry.entryDate;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!activityMap[dateKey]) activityMap[dateKey] = { count: 0, labels: [] };
      activityMap[dateKey].count += 1;
      activityMap[dateKey].labels.push(entry.pillar);
    }
    for (const log of allHabitLogs) {
      const d = log.logDate;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!activityMap[dateKey]) activityMap[dateKey] = { count: 0, labels: [] };
      activityMap[dateKey].count += 1;
      activityMap[dateKey].labels.push(log.habitKey);
    }

    return NextResponse.json({
      daysUntilIronman: ironmanDate ? diffUtcDays(today, ironmanDate) : null,
      daysUntilNextCheckpoint: currentCheckpointDate ? diffUtcDays(today, currentCheckpointDate) : null,
      currentCheckpoint,
      activityWall: activityMap,
      pillarSummaries: {
        latestBodyweightEntry,
        latestStrengthEntry,
        bookCounts: {
          total: bookEntries.length,
          nonfiction: nonfictionBooks.length,
          fiction: fictionBooks.length,
          entryCount: bookEntries.length,
        },
        paintingCount: {
          total: sumEntryValues(paintingEntries),
          entryCount: paintingEntries.length,
        },
        hikeCount: {
          total: sumEntryValues(hikeEntries),
          entryCount: hikeEntries.length,
        },
        journalingStreak: calculateStreaks(journalingLogs.map((log) => log.logDate)),
        lastSelfCheckScores: latestSelfCheck,
      },
    });
  } catch (error) {
    console.error("Failed to build dashboard", error);
    return jsonError("Failed to build dashboard");
  }
}
