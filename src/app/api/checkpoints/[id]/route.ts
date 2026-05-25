export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { getAssessmentsForCheckpoint, getCheckpointsFromConfig, jsonError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const activeConfig = await prisma.config.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeConfig) {
      return jsonError("Active config not found", 404);
    }

    const checkpoint = getCheckpointsFromConfig(activeConfig.data).find((item) => item.id === id);
    if (!checkpoint) {
      return jsonError("Checkpoint not found", 404);
    }

    const entries = await prisma.entry.findMany({
      where: { checkpointId: id },
      orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
    });

    return NextResponse.json({ checkpoint, entries, assessments: getAssessmentsForCheckpoint(activeConfig.data, id) });
  } catch (error) {
    console.error("Failed to fetch checkpoint", error);
    return jsonError("Failed to fetch checkpoint");
  }
}
