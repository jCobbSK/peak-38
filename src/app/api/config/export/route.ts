export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const [config, entries, selfChecks, habitLogs] = await Promise.all([
      prisma.config.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.entry.findMany({
        orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
      }),
      prisma.selfCheck.findMany({
        orderBy: [{ weekDate: "desc" }, { loggedAt: "desc" }],
      }),
      prisma.habitLog.findMany({
        orderBy: [{ logDate: "desc" }, { habitKey: "asc" }],
      }),
    ]);

    return NextResponse.json({
      export_meta: {
        exportedAt: new Date().toISOString(),
        app: "peak-38",
        counts: {
          entries: entries.length,
          self_checks: selfChecks.length,
          habit_logs: habitLogs.length,
        },
      },
      config,
      entries,
      self_checks: selfChecks,
      habit_logs: habitLogs,
    });
  } catch (error) {
    console.error("Failed to export data", error);
    return jsonError("Failed to export data");
  }
}
