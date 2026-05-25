export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError, mergeGoalTargets } from "@/lib/api-utils";

type ConfigImportBody = {
  mode?: "full_restore" | "goal_update";
  config?: Prisma.JsonValue;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConfigImportBody;

    if (!body.mode || !["full_restore", "goal_update"].includes(body.mode)) {
      return jsonError("Invalid import mode", 400);
    }

    if (!body.config || typeof body.config !== "object") {
      return jsonError("Config payload is required", 400);
    }

    if (body.mode === "full_restore") {
      const latestConfig = await prisma.config.findFirst({
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      });

      const createdConfig = await prisma.$transaction(async (tx) => {
        await tx.config.updateMany({
          data: { isActive: false },
        });

        return tx.config.create({
          data: {
            version: (latestConfig?.version ?? 0) + 1,
            data: body.config as Prisma.InputJsonValue,
            isActive: true,
          },
        });
      });

      return NextResponse.json(
        {
          mode: body.mode,
          config: createdConfig,
        },
        { status: 201 }
      );
    }

    const activeConfig = await prisma.config.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeConfig) {
      return jsonError("Active config not found", 404);
    }

    const merged = mergeGoalTargets(activeConfig.data, body.config);
    const updatedConfig = await prisma.config.update({
      where: { id: activeConfig.id },
      data: {
        data: merged.data as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });

    return NextResponse.json({
      mode: body.mode,
      config: updatedConfig,
      diff: merged.diff,
    });
  } catch (error) {
    console.error("Failed to import config", error);
    return jsonError("Failed to import config");
  }
}
