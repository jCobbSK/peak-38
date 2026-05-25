export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { jsonError, parseDateOnly, parseDateTime } from "@/lib/api-utils";

type EntryUpdateBody = {
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
  loggedAt?: string | null;
  logged_at?: string | null;
  entryDate?: string;
  entry_date?: string;
};

function buildEntryUpdateData(body: EntryUpdateBody): Prisma.EntryUpdateInput {
  const data: Prisma.EntryUpdateInput = {};

  if ("checkpointId" in body || "checkpoint_id" in body) {
    data.checkpointId = body.checkpointId ?? body.checkpoint_id ?? null;
  }
  if (typeof body.pillar === "string") data.pillar = body.pillar;
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.metricKey === "string" || typeof body.metric_key === "string") {
    data.metricKey = body.metricKey ?? body.metric_key;
  }
  if ("valueNumeric" in body || "value_numeric" in body) {
    const valueNumeric = body.valueNumeric ?? body.value_numeric;
    data.valueNumeric =
      valueNumeric === null || valueNumeric === undefined || valueNumeric === ""
        ? null
        : new Prisma.Decimal(valueNumeric);
  }
  if ("valueText" in body || "value_text" in body) data.valueText = body.valueText ?? body.value_text ?? null;
  if ("valueBoolean" in body || "value_boolean" in body) data.valueBoolean = body.valueBoolean ?? body.value_boolean ?? null;
  if ("proofUrl" in body || "proof_url" in body) data.proofUrl = body.proofUrl ?? body.proof_url ?? null;
  if ("proofType" in body || "proof_type" in body) data.proofType = body.proofType ?? body.proof_type ?? null;
  if (typeof body.isVerified === "boolean" || typeof body.is_verified === "boolean") {
    data.isVerified = body.isVerified ?? body.is_verified;
  }
  if ("notes" in body) data.notes = body.notes ?? null;
  const entryDateValue = body.entryDate ?? body.entry_date;
  if (typeof entryDateValue === "string") {
    const entryDate = parseDateOnly(entryDateValue);
    if (!entryDate) {
      throw new Error("INVALID_ENTRY_DATE");
    }
    data.entryDate = entryDate;
  }
  if ("loggedAt" in body || "logged_at" in body) {
    const loggedAtValue = body.loggedAt ?? body.logged_at;
    if (loggedAtValue === null) {
      data.loggedAt = new Date();
    } else {
      const loggedAt = parseDateTime(loggedAtValue);
      if (!loggedAt) {
        throw new Error("INVALID_LOGGED_AT");
      }
      data.loggedAt = loggedAt;
    }
  }

  return data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = Number(id);

    if (!Number.isInteger(entryId)) {
      return jsonError("Invalid entry id", 400);
    }

    const body = (await request.json()) as EntryUpdateBody;
    const data = buildEntryUpdateData(body);

    if (Object.keys(data).length === 0) {
      return jsonError("No entry fields provided", 400);
    }

    const entry = await prisma.entry.update({
      where: { id: entryId },
      data,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof Error && ["INVALID_ENTRY_DATE", "INVALID_LOGGED_AT"].includes(error.message)) {
      return jsonError("Invalid entry payload", 400);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Entry not found", 404);
    }

    console.error("Failed to update entry", error);
    return jsonError("Failed to update entry");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = Number(id);

    if (!Number.isInteger(entryId)) {
      return jsonError("Invalid entry id", 400);
    }

    await prisma.entry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Entry not found", 404);
    }

    console.error("Failed to delete entry", error);
    return jsonError("Failed to delete entry");
  }
}
