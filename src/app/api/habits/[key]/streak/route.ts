export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { calculateStreaks, jsonError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const completedLogs = await prisma.habitLog.findMany({
      where: {
        habitKey: key,
        completed: true,
      },
      orderBy: { logDate: "asc" },
      select: {
        logDate: true,
      },
    });

    const streaks = calculateStreaks(completedLogs.map((log) => log.logDate));

    return NextResponse.json({
      habitKey: key,
      completedDays: completedLogs.length,
      ...streaks,
    });
  } catch (error) {
    console.error("Failed to calculate habit streak", error);
    return jsonError("Failed to calculate habit streak");
  }
}
