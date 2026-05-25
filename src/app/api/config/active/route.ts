export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { productKey?: string; label?: string };

    if (!body.productKey || typeof body.productKey !== "string") {
      return jsonError("productKey is required", 400);
    }
    if (typeof body.label !== "string") {
      return jsonError("label is required", 400);
    }

    const activeConfig = await prisma.config.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeConfig) {
      return jsonError("Active config not found", 404);
    }

    const data = activeConfig.data;
    if (!isPlainObject(data)) {
      return jsonError("Config data is malformed", 500);
    }

    const pillars = isPlainObject(data.pillars) ? { ...data.pillars } : {};
    const mind = isPlainObject(pillars.mind) ? { ...pillars.mind } : {};
    const products = Array.isArray(mind.products) ? (mind.products as PlainObject[]) : [];

    const productIndex = products.findIndex((p) => isPlainObject(p) && p.key === body.productKey);
    if (productIndex === -1) {
      return jsonError(`Product with key "${body.productKey}" not found`, 404);
    }

    const updatedProducts = products.map((p, i) =>
      i === productIndex ? { ...p, label: body.label } : p,
    );

    const updatedConfig = await prisma.config.update({
      where: { id: activeConfig.id },
      data: {
        data: {
          ...data,
          pillars: {
            ...pillars,
            mind: {
              ...mind,
              products: updatedProducts,
            },
          },
        } as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error("Failed to update product label", error);
    return jsonError("Failed to update product label");
  }
}

export async function GET(_request: NextRequest) {
  try {
    const config = await prisma.config.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      return jsonError("Active config not found", 404);
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to fetch active config", error);
    return jsonError("Failed to fetch active config");
  }
}
