export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError, parseDateOnly } from "@/lib/api-utils";

type SelfCheckBody = {
  weekDate?: string;
  week_date?: string;
  energy?: number | null;
  sleepQuality?: number | null;
  sleep_quality?: number | null;
  relationshipQuality?: number | null;
  relationship_quality?: number | null;
  workSatisfaction?: number | null;
  work_satisfaction?: number | null;
  notes?: string | null;
};

export async function GET(_request: NextRequest) {
  try {
    const selfChecks = await prisma.selfCheck.findMany({
      orderBy: [{ weekDate: "desc" }, { loggedAt: "desc" }],
    });

    return NextResponse.json({ selfChecks });
  } catch (error) {
    console.error("Failed to fetch self-checks", error);
    return jsonError("Failed to fetch self-checks");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelfCheckBody;
    const weekDate = parseDateOnly(body.weekDate ?? body.week_date);

    if (!weekDate) {
      return jsonError("Valid weekDate is required", 400);
    }

    const selfCheck = await prisma.selfCheck.create({
      data: {
        weekDate,
        energy: body.energy ?? null,
        sleepQuality: body.sleepQuality ?? body.sleep_quality ?? null,
        relationshipQuality: body.relationshipQuality ?? body.relationship_quality ?? null,
        workSatisfaction: body.workSatisfaction ?? body.work_satisfaction ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ selfCheck }, { status: 201 });
  } catch (error) {
    console.error("Failed to create self-check", error);
    return jsonError("Failed to create self-check");
  }
}
