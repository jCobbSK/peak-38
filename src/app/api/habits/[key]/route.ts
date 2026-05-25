export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const habitLogs = await prisma.habitLog.findMany({
      where: { habitKey: key },
      orderBy: [{ logDate: "desc" }],
    });

    return NextResponse.json({ habitKey: key, habitLogs });
  } catch (error) {
    console.error("Failed to fetch habit logs", error);
    return jsonError("Failed to fetch habit logs");
  }
}
