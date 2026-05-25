"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fetchCheckpoint, createEntry } from "@/lib/api";
import ProofLink from "@/components/ProofLink";
import type { AssessmentValueType } from "@/lib/api-utils";
import {
  asArray,
  asRecord,
  formatDate,
  formatTime,
  getNumber,
  getString,
  parseTimeToSeconds,
  slugToLabel,
  valueFromEntry,
} from "@/lib/utils";

type Assessment = {
  key: string;
  label: string;
  pillar: string;
  category: string;
  unit?: string;
  valueType: AssessmentValueType;
  target?: number | string | null;
  targetDisplay?: string;
  note?: string;
};

function formatTarget(assessment: Assessment): string {
  if (assessment.targetDisplay) return assessment.targetDisplay;
  if (assessment.target === null || assessment.target === undefined) return "—";
  if (assessment.valueType === "time" && typeof assessment.target === "number") {
    return formatTime(assessment.target);
  }
  if (typeof assessment.target === "boolean") return assessment.target ? "Complete" : "Not yet";
  return `${assessment.target}${assessment.unit && assessment.unit !== "time" ? ` ${assessment.unit}` : ""}`;
}

function formatActual(entry: Record<string, unknown> | undefined, assessment: Assessment): string {
  if (!entry) return "—";
  const val = valueFromEntry(asRecord(entry));
  if (val === undefined) return "—";
  if (assessment.valueType === "time" && typeof val === "number") return formatTime(val);
  if (typeof val === "boolean") return val ? "Complete" : "Not yet";
  return `${val}${assessment.unit && assessment.unit !== "time" ? ` ${assessment.unit}` : ""}`;
}

function isAssessmentDone(entry: Record<string, unknown> | undefined, assessment: Assessment): boolean {
  if (!entry) return false;
  const val = valueFromEntry(asRecord(entry));
  if (val === undefined) return false;
  if (typeof val === "boolean") return val;
  if (assessment.target === null || assessment.target === undefined) return true;
  if (typeof val === "number" && typeof assessment.target === "number") {
    return val >= assessment.target;
  }
  return true;
}

type LogFormProps = {
  assessment: Assessment;
  checkpointId: string;
  onSaved: () => void;
};

function LogForm({ assessment, checkpointId, onSaved }: LogFormProps) {
  const [numericValue, setNumericValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [booleanValue, setBooleanValue] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const reset = useCallback(() => {
    setNumericValue("");
    setTextValue("");
    setTimeValue("");
    setBooleanValue(false);
    setProofUrl("");
    setError(null);
    setOpen(false);
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createEntry({
        checkpoint_id: checkpointId,
        pillar: assessment.pillar,
        category: assessment.category,
        metric_key: assessment.key,
        value_numeric:
          assessment.valueType === "numeric"
            ? Number(numericValue)
            : assessment.valueType === "time"
              ? parseTimeToSeconds(timeValue)
              : undefined,
        value_text: assessment.valueType === "text" ? textValue : undefined,
        value_boolean: assessment.valueType === "boolean" ? booleanValue : undefined,
        proof_url: proofUrl || undefined,
        entry_date: new Date().toISOString().slice(0, 10),
      });
      reset();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save entry");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary !px-4 !py-2 text-sm"
      >
        Log result
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      {assessment.valueType === "numeric" && (
        <label className="grid gap-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Value{assessment.unit && assessment.unit !== "time" ? ` (${assessment.unit})` : ""}</span>
          <input
            value={numericValue}
            onChange={(e) => setNumericValue(e.target.value)}
            type="number"
            step="any"
            required
            placeholder="0"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>
      )}
      {assessment.valueType === "text" && (
        <label className="grid gap-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Result</span>
          <input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            required
            placeholder="Enter result"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>
      )}
      {assessment.valueType === "time" && (
        <label className="grid gap-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Time (MM:SS or HH:MM:SS)</span>
          <input
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            required
            placeholder="e.g. 57:00"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
          />
        </label>
      )}
      {assessment.valueType === "boolean" && (
        <label className="flex items-center gap-3 text-sm text-white">
          <input
            checked={booleanValue}
            onChange={(e) => setBooleanValue(e.target.checked)}
            type="checkbox"
            className="h-4 w-4 rounded border-white/20"
          />
          Mark as completed
        </label>
      )}
      <label className="grid gap-1 text-sm">
        <span className="text-[var(--color-text-secondary)]">Proof URL (optional)</span>
        <input
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="https://"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
        />
      </label>
      {error ? <p className="text-xs text-[var(--color-accent-red)]">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="btn-primary !px-4 !py-2 text-sm disabled:opacity-60">
          {submitting ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={reset} className="btn-secondary !px-4 !py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CheckpointDetailPage() {
  const params = useParams<{ id: string }>();
  const checkpointId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [entries, setEntries] = useState<Record<string, unknown>[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!checkpointId) return;
    try {
      const response = await fetchCheckpoint(checkpointId);
      const payload = asRecord(response);
      setData(asRecord(payload.checkpoint ?? response));
      setEntries(asArray<Record<string, unknown>>(payload.entries));
      setAssessments(asArray<Assessment>(payload.assessments));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load checkpoint");
    } finally {
      setLoading(false);
    }
  }, [checkpointId]);

  useEffect(() => { void load(); }, [load]);

  const entryByKey = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const entry of entries) {
      const key = getString(entry.metricKey ?? entry.metric_key);
      if (key) map.set(key, entry);
    }
    return map;
  }, [entries]);

  const groupedAssessments = useMemo(() => {
    const groups = new Map<string, Assessment[]>();
    for (const a of assessments) {
      const existing = groups.get(a.pillar) ?? [];
      existing.push(a);
      groups.set(a.pillar, existing);
    }
    return Array.from(groups.entries()).map(([pillar, items]) => ({ pillar, items }));
  }, [assessments]);

  const totalItems = assessments.length;
  const completedItems = assessments.filter((a) => isAssessmentDone(entryByKey.get(a.key), a)).length;
  const progress = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(getString(data?.date))}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl text-white">{getString(data?.label ?? data?.name, "Checkpoint")}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">{getString(data?.description ?? data?.summary, "No checkpoint brief written yet.")}</p>
        {totalItems > 0 && (
          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--color-text-secondary)]">Progress</span>
              <span className="metric-font text-white">{completedItems} / {totalItems}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/6">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent-blue),var(--color-accent-green))]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading checkpoint…</div> : null}
      {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

      <div className="grid gap-5">
        {groupedAssessments.map(({ pillar, items }) => (
          <section key={pillar} className="card">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Pillar</p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{slugToLabel(pillar)}</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">{items.length} items</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {items.map((assessment) => {
                const entry = entryByKey.get(assessment.key);
                const done = isAssessmentDone(entry, assessment);
                const proofUrl = getString(asRecord(entry).proofUrl ?? asRecord(entry).proof_url);

                return (
                  <article key={`${pillar}-${assessment.key}`} className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{slugToLabel(assessment.category)}</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{assessment.label}</h3>
                        {assessment.note ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{assessment.note}</p> : null}
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${done ? "border-[var(--color-accent-green)]/30 bg-[rgba(16,185,129,0.12)] text-[var(--color-accent-green)]" : "border-[var(--color-accent-red)]/20 bg-[rgba(239,68,68,0.08)] text-[rgba(239,68,68,0.92)]"}`}>
                        {done ? "✓ Complete" : "⚑ Pending"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Target</p>
                        <p className="metric-font mt-2 text-2xl text-white">{formatTarget(assessment)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Actual</p>
                        <p className="metric-font mt-2 text-2xl text-white">{formatActual(entry, assessment)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <ProofLink url={proofUrl} label="Proof" />
                    </div>

                    <LogForm assessment={assessment} checkpointId={checkpointId} onSaved={load} />
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {!loading && groupedAssessments.length === 0 && (
          <div className="card text-sm text-[var(--color-text-secondary)]">No assessments defined for this checkpoint.</div>
        )}
      </div>
    </div>
  );
}

