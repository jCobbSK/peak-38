export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError, parseDateOnly } from "@/lib/api-utils";

type HabitLogBody = {
  completed?: boolean;
  notes?: string | null;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string; date: string }> }
) {
  try {
    const [{ key, date }, body] = await Promise.all([
      params,
      request.json() as Promise<HabitLogBody>,
    ]);

    const logDate = parseDateOnly(date);
    if (!logDate) {
      return jsonError("Invalid habit date", 400);
    }

    const habitLog = await prisma.habitLog.upsert({
      where: {
        habitKey_logDate: {
          habitKey: key,
          logDate,
        },
      },
      update: {
        completed: body.completed ?? true,
        notes: body.notes ?? null,
      },
      create: {
        habitKey: key,
        logDate,
        completed: body.completed ?? true,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ habitLog }, { status: 201 });
  } catch (error) {
    console.error("Failed to log habit completion", error);
    return jsonError("Failed to log habit completion");
  }
}
