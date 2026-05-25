export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError, parseDateOnly, parseDateTime } from "@/lib/api-utils";

type EntryBody = {
  checkpointId?: string | null;
  checkpoint_id?: string | null;
  pillar?: string;
  category?: string;
  metricKey?: string;
  metric_key?: string;
  valueNumeric?: number | string | null;
  value_numeric?: number | string | null;
  valueText?: string | null;
  value_text?: string | null;
  valueBoolean?: boolean | null;
  value_boolean?: boolean | null;
  proofUrl?: string | null;
  proof_url?: string | null;
  proofType?: string | null;
  proof_type?: string | null;
  isVerified?: boolean;
  is_verified?: boolean;
  notes?: string | null;
  loggedAt?: string;
  logged_at?: string;
  entryDate?: string;
  entry_date?: string;
};

function buildEntryCreateData(body: EntryBody): Prisma.EntryCreateInput | null {
  const metricKey = body.metricKey ?? body.metric_key;
  const entryDateValue = body.entryDate ?? body.entry_date;
  const loggedAtValue = body.loggedAt ?? body.logged_at;

  if (!body.pillar || !body.category || !metricKey || !entryDateValue) {
    return null;
  }

  const entryDate = parseDateOnly(entryDateValue);
  if (!entryDate) {
    return null;
  }

  const loggedAt = loggedAtValue ? parseDateTime(loggedAtValue) : null;
  if (loggedAtValue && !loggedAt) {
    return null;
  }

  const valueNumeric = body.valueNumeric ?? body.value_numeric;
  const valueText = body.valueText ?? body.value_text;
  const valueBoolean = body.valueBoolean ?? body.value_boolean;
  const proofUrl = body.proofUrl ?? body.proof_url;
  const proofType = body.proofType ?? body.proof_type;
  const isVerified = body.isVerified ?? body.is_verified;

  return {
    checkpointId: body.checkpointId ?? body.checkpoint_id ?? null,
    pillar: body.pillar,
    category: body.category,
    metricKey,
    valueNumeric:
      valueNumeric === null || valueNumeric === undefined || valueNumeric === ""
        ? null
        : new Prisma.Decimal(valueNumeric),
    valueText: valueText ?? null,
    valueBoolean: valueBoolean ?? null,
    proofUrl: proofUrl ?? null,
    proofType: proofType ?? null,
    isVerified: isVerified ?? false,
    notes: body.notes ?? null,
    loggedAt: loggedAt ?? undefined,
    entryDate,
  };
}

export async function GET(request: NextRequest) {
  try {
    const checkpoint = request.nextUrl.searchParams.get("checkpoint");
    const pillar = request.nextUrl.searchParams.get("pillar");
    const metricKey = request.nextUrl.searchParams.get("metric_key");

    const where: Prisma.EntryWhereInput = {};
    if (checkpoint) {
      where.checkpointId = checkpoint;
    }
    if (pillar) {
      where.pillar = pillar;
    }
    if (metricKey) {
      where.metricKey = metricKey;
    }

    const entries = await prisma.entry.findMany({
      where,
      orderBy: [{ entryDate: "desc" }, { loggedAt: "desc" }],
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to fetch entries", error);
    return jsonError("Failed to fetch entries");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EntryBody;
    const data = buildEntryCreateData(body);

    if (!data) {
      return jsonError("Invalid entry payload", 400);
    }

    const entry = await prisma.entry.create({ data });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create entry", error);
    return jsonError("Failed to create entry");
  }
}
