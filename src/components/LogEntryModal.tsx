"use client";

import { useEffect, useMemo, useState } from "react";
import { createEntry } from "@/lib/api";
import { dateInputValue, parseTimeToSeconds, slugToLabel } from "@/lib/utils";

type Prefill = {
  metric_key?: string;
  pillar?: string;
  category?: string;
  checkpoint_id?: string;
};

type LogEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefill?: Prefill;
};

type MetricConfig = {
  key: string;
  label: string;
  type: "numeric" | "text" | "time" | "boolean";
  unit?: string;
};

const metricCatalog: Record<string, Record<string, MetricConfig[]>> = {
  physical: {
    strength: [
      { key: "squat", label: "Squat", type: "numeric", unit: "kg" },
      { key: "deadlift", label: "Deadlift", type: "numeric", unit: "kg" },
      { key: "bench_press", label: "Bench Press", type: "numeric", unit: "kg" },
      { key: "pull_up", label: "Pull-up", type: "numeric", unit: "reps" },
    ],
    bodyweight: [{ key: "bodyweight", label: "Bodyweight", type: "numeric", unit: "kg" }],
    races: [
      { key: "race_result", label: "Race Result", type: "time" },
      { key: "race_target", label: "Race Target", type: "time" },
      { key: "race_note", label: "Race Note", type: "text" },
    ],
    mobility: [
      { key: "ankle_mobility", label: "Ankle Mobility", type: "numeric", unit: "cm" },
      { key: "hip_rotation", label: "Hip Rotation", type: "numeric", unit: "°" },
      { key: "thoracic_extension", label: "Thoracic Extension", type: "boolean" },
    ],
  },
  mind: {
    products: [
      { key: "milestone_complete", label: "Milestone Complete", type: "boolean" },
      { key: "product_phase", label: "Product Phase", type: "text" },
      { key: "weekly_focus", label: "Weekly Focus", type: "text" },
    ],
    reading: [
      { key: "book_finished", label: "Book Finished", type: "text" },
      { key: "reading_minutes", label: "Reading Minutes", type: "numeric", unit: "min" },
    ],
    skills: [{ key: "skill_progress", label: "Skill Progress", type: "text" }],
    career: [{ key: "career_status", label: "Career Status", type: "text" }],
    alias_posts: [{ key: "alias_post", label: "Alias Post", type: "text" }],
  },
  personal: {
    paintings: [{ key: "painting_complete", label: "Painting Complete", type: "text" }],
    hikes: [{ key: "hike_complete", label: "Hike Logged", type: "text" }],
    dates: [{ key: "weekly_date", label: "Weekly Date", type: "text" }],
    journaling: [{ key: "journal_entry", label: "Journal Entry", type: "boolean" }],
  },
  recovery: {
    self_check: [
      { key: "energy", label: "Energy", type: "numeric", unit: "/10" },
      { key: "sleep_quality", label: "Sleep Quality", type: "numeric", unit: "/10" },
      { key: "relationship_quality", label: "Relationship Quality", type: "numeric", unit: "/10" },
      { key: "work_satisfaction", label: "Work Satisfaction", type: "numeric", unit: "/10" },
    ],
    transition_ritual: [{ key: "transition_ritual", label: "Transition Ritual", type: "boolean" }],
    boundaries: [{ key: "boundary_score", label: "Boundary Score", type: "numeric", unit: "/10" }],
    social_physical: [{ key: "social_physical", label: "Social / Physical", type: "text" }],
  },
};

const pillars = Object.keys(metricCatalog);

export default function LogEntryModal({ isOpen, onClose, onSuccess, prefill }: LogEntryModalProps) {
  const [pillar, setPillar] = useState(prefill?.pillar ?? "physical");
  const [category, setCategory] = useState(prefill?.category ?? Object.keys(metricCatalog.physical)[0]);
  const [metricKey, setMetricKey] = useState(prefill?.metric_key ?? metricCatalog.physical.strength[0].key);
  const [entryDate, setEntryDate] = useState(dateInputValue());
  const [numericValue, setNumericValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [booleanValue, setBooleanValue] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState("Self-reported");
  const [notes, setNotes] = useState("");
  const [bookType, setBookType] = useState<"fiction" | "nonfiction">("nonfiction");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const nextPillar = prefill?.pillar ?? "physical";
    const nextCategories = Object.keys(metricCatalog[nextPillar] ?? metricCatalog.physical);
    const nextCategory = prefill?.category && nextCategories.includes(prefill.category) ? prefill.category : nextCategories[0];
    const nextMetrics = metricCatalog[nextPillar]?.[nextCategory] ?? metricCatalog.physical.strength;
    const nextMetricKey = prefill?.metric_key && nextMetrics.some((metric) => metric.key === prefill.metric_key)
      ? prefill.metric_key
      : nextMetrics[0].key;

    setPillar(nextPillar);
    setCategory(nextCategory);
    setMetricKey(nextMetricKey);
    setEntryDate(dateInputValue());
    setNumericValue("");
    setTextValue("");
    setTimeValue("");
    setBooleanValue(false);
    setProofUrl("");
    setProofType("Self-reported");
    setNotes("");
    setBookType("nonfiction");
    setError(null);
  }, [isOpen, prefill]);

  const categories = useMemo(() => Object.keys(metricCatalog[pillar] ?? {}), [pillar]);

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] ?? "strength");
    }
  }, [categories, category]);

  const metricOptions = useMemo(() => {
    return metricCatalog[pillar]?.[category] ?? [];
  }, [pillar, category]);

  useEffect(() => {
    if (metricOptions.length > 0 && !metricOptions.some((metric) => metric.key === metricKey)) {
      setMetricKey(metricOptions[0].key);
    }
  }, [metricOptions, metricKey]);

  const selectedMetric = metricOptions.find((metric) => metric.key === metricKey) ?? metricOptions[0];
  const stravaProof = proofUrl.toLowerCase().includes("strava");
  const isBookEntry = metricKey === "book_finished";

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMetric) return;

    setSubmitting(true);
    setError(null);

    try {
      const effectiveMetricKey = isBookEntry ? `book_finished_${bookType}` : metricKey;
      const effectiveNotes = isBookEntry && !notes ? bookType : notes || undefined;
      await createEntry({
        checkpoint_id: prefill?.checkpoint_id,
        pillar,
        category,
        metric_key: effectiveMetricKey,
        value_numeric:
          selectedMetric.type === "numeric"
            ? Number(numericValue)
            : selectedMetric.type === "time"
              ? parseTimeToSeconds(timeValue)
              : undefined,
        value_text: selectedMetric.type === "text" ? textValue : undefined,
        value_boolean: selectedMetric.type === "boolean" ? booleanValue : undefined,
        proof_url: proofUrl || undefined,
        proof_type: proofType,
        notes: effectiveNotes,
        entry_date: entryDate,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,8,14,0.78)] p-3 backdrop-blur md:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.97),rgba(10,10,15,0.97))] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between border-b border-white/8 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">New entry</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Log something worth remembering.</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:text-white">
            Close
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Pillar</span>
              <select value={pillar} onChange={(event) => setPillar(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
                {pillars.map((option) => <option key={option} value={option}>{slugToLabel(option)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
                {categories.map((option) => <option key={option} value={option}>{slugToLabel(option)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Metric</span>
              <select value={metricKey} onChange={(event) => setMetricKey(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
                {metricOptions.map((metric) => <option key={metric.key} value={metric.key}>{metric.label}</option>)}
              </select>
            </label>
          </div>

          {selectedMetric?.type === "numeric" && (
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Value</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <input value={numericValue} onChange={(event) => setNumericValue(event.target.value)} type="number" step="any" className="w-full bg-transparent outline-none" placeholder="0" required />
                {selectedMetric.unit ? <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{selectedMetric.unit}</span> : null}
              </div>
            </label>
          )}

          {selectedMetric?.type === "text" && (
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Details</span>
              <textarea value={textValue} onChange={(event) => setTextValue(event.target.value)} className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" placeholder="Book title, note, or milestone details" required />
            </label>
          )}

          {isBookEntry && (
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Book type</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBookType("nonfiction")}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${bookType === "nonfiction" ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]" : "border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:text-white"}`}
                >
                  Non-fiction
                </button>
                <button
                  type="button"
                  onClick={() => setBookType("fiction")}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${bookType === "fiction" ? "border-[var(--color-accent-purple)] bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)]" : "border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:text-white"}`}
                >
                  Fiction
                </button>
              </div>
            </label>
          )}

          {selectedMetric?.type === "time" && (
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Time</span>
              <input value={timeValue} onChange={(event) => setTimeValue(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" placeholder="MM:SS or HH:MM:SS" required />
            </label>
          )}

          {selectedMetric?.type === "boolean" && (
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white">
              <input checked={booleanValue} onChange={(event) => setBooleanValue(event.target.checked)} type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
              Mark this habit / milestone as completed.
            </label>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Entry date</span>
              <input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Proof type</span>
              <select value={proofType} onChange={(event) => setProofType(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
                {["Strava", "URL", "Photo URL", "Self-reported"].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Proof URL</span>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <input value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} className="w-full bg-transparent outline-none" placeholder="https://" />
              {stravaProof ? <span className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--color-accent-orange)]">▲ Strava link detected</span> : null}
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" placeholder="Context, friction, or what changed" />
          </label>

          {error ? <p className="text-sm text-[var(--color-accent-red)]">{error}</p> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 md:flex-row md:items-center md:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Saving…" : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
