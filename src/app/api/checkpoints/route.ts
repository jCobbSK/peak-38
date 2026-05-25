export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { getCheckpointsFromConfig, jsonError } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const activeConfig = await prisma.config.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeConfig) {
      return jsonError("Active config not found", 404);
    }

    const checkpoints = getCheckpointsFromConfig(activeConfig.data);
    const checkpointIds = checkpoints.map((checkpoint) => checkpoint.id);
    const groupedEntries = checkpointIds.length
      ? await prisma.entry.groupBy({
          by: ["checkpointId"],
          _count: { _all: true },
          where: {
            checkpointId: { in: checkpointIds },
          },
        })
      : [];

    const entryCountMap = new Map(
      groupedEntries
        .filter((item) => item.checkpointId)
        .map((item) => [item.checkpointId as string, item._count._all])
    );

    return NextResponse.json({
      checkpoints: checkpoints.map((checkpoint) => {
        const entryCount = entryCountMap.get(checkpoint.id) ?? 0;
        return {
          ...checkpoint,
          entryCount,
          isComplete: entryCount > 0,
        };
      }),
    });
  } catch (error) {
    console.error("Failed to fetch checkpoints", error);
    return jsonError("Failed to fetch checkpoints");
  }
}
