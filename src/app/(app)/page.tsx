"use client";

import { useEffect, useMemo, useState } from "react";
import { createEntry, fetchDashboard, logHabit } from "@/lib/api";
import LogEntryModal from "@/components/LogEntryModal";
import ActivityWall from "@/components/ActivityWall";
import { asRecord, dateInputValue, daysUntil, extractGoalsByPillar, formatDate, formatMetricValue, getNumber, getString, slugToLabel, valueFromEntry } from "@/lib/utils";

type SummaryLine = {
  label: string;
  value: string;
};

function SummaryCard({ title, accent, lines, onLog }: { title: string; accent: string; lines: SummaryLine[]; onLog?: () => void }) {
  return (
    <section className="card relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">{title}</p>
        {onLog && (
          <button type="button" onClick={onLog} className="btn-secondary !px-3 !py-1 text-xs">Log</button>
        )}
      </div>
      <div className="mt-5 space-y-3">
        {lines.map((line) => (
          <div key={`${title}-${line.label}`} className="flex items-start justify-between gap-4 border-b border-white/6 pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-[var(--color-text-secondary)]">{line.label}</span>
            <span className="max-w-[60%] text-right text-sm font-semibold text-white">{line.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function JournalWidget({ onLogged }: { onLogged: () => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await createEntry({
        pillar: "personal",
        category: "journaling",
        metric_key: "journal_entry",
        value_text: text.trim(),
        value_boolean: true,
        entry_date: dateInputValue(),
      });
      await logHabit("journaling", dateInputValue());
      setText("");
      setSuccess(true);
      onLogged();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // silently fail - user can retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-accent-green)] via-[var(--color-accent-blue)] to-transparent" />
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Daily journal</p>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">What&apos;s on your mind today?</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your thoughts, reflections, or observations…"
        className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-blue)]/40"
      />
      <div className="mt-3 flex items-center justify-between">
        {success ? (
          <span className="text-sm text-[var(--color-accent-green)]">✓ Journal saved</span>
        ) : (
          <span className="text-sm text-[var(--color-text-muted)]">{text.length > 0 ? `${text.length} characters` : ""}</span>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !text.trim()}
          className="btn-primary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save entry"}
        </button>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<{ pillar: string } | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const openLog = (pillar: string) => {
    setModalPrefill({ pillar });
    setOpenModal(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetchDashboard();
        if (active) setData(response);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const dashboard = asRecord(data);
  const summary = asRecord(dashboard.pillarSummaries ?? dashboard.pillar_summaries ?? dashboard.summary);
  const ironmanDate = getString(dashboard.ironmanDate || dashboard.ironman_date, "2028-08-02");
  const nextCheckpoint = asRecord(dashboard.currentCheckpoint ?? dashboard.current_checkpoint ?? dashboard.nextCheckpoint ?? dashboard.next_checkpoint);
  const checkpointDate = getString(nextCheckpoint.date);
  const countdownDays = useMemo(() => getNumber(dashboard.daysUntilIronman, daysUntil(ironmanDate)), [dashboard.daysUntilIronman, ironmanDate]);
  const checkpointDays = useMemo(() => getNumber(dashboard.daysUntilNextCheckpoint, daysUntil(checkpointDate)), [dashboard.daysUntilNextCheckpoint, checkpointDate]);

  const latestBodyweightEntry = asRecord(summary.latestBodyweightEntry);
  const latestStrengthEntry = asRecord(summary.latestStrengthEntry);
  const bookCounts = asRecord(summary.bookCounts);
  const paintingCount = asRecord(summary.paintingCount);
  const hikeCount = asRecord(summary.hikeCount);
  const journalingStreak = asRecord(summary.journalingStreak);
  const lastSelfCheck = asRecord(summary.lastSelfCheckScores);
  const targetWeightGoal = extractGoalsByPillar(nextCheckpoint, "physical").find((goal) => {
    const metric = getString(goal.metric_key || goal.metricKey).toLowerCase();
    return metric.includes("bodyweight") || metric.includes("weight");
  });

  const physicalLines: SummaryLine[] = [
    {
      label: "Bodyweight",
      value: `${formatMetricValue(valueFromEntry(latestBodyweightEntry), "kg")} / ${formatMetricValue(targetWeightGoal?.target ?? targetWeightGoal?.target_value ?? targetWeightGoal?.targetValue, "kg")}`,
    },
    {
      label: "Last strength",
      value: latestStrengthEntry.metricKey || latestStrengthEntry.metric_key
        ? `${slugToLabel(getString(latestStrengthEntry.metricKey || latestStrengthEntry.metric_key))} · ${formatMetricValue(valueFromEntry(latestStrengthEntry))}`
        : "No entry yet",
    },
    {
      label: "Next race",
      value: getString(asRecord(summary.physical).nextRace || nextCheckpoint.label || nextCheckpoint.name, "Unscheduled"),
    },
  ];

  const mindLines: SummaryLine[] = [
    {
      label: "Books",
      value: `${getNumber(bookCounts.nonfiction, 0)} NF · ${getNumber(bookCounts.fiction, 0)} Fiction (${getNumber(bookCounts.total, 0)} total)`,
    },
    {
      label: "Current phase",
      value: getString(asRecord(summary.mind).current_product_phase || asRecord(summary.mind).productPhase, "Phase not logged"),
    },
    {
      label: "Career",
      value: getString(asRecord(summary.mind).career_status || asRecord(summary.mind).careerStatus, "Quiet mode"),
    },
  ];

  const personalLines: SummaryLine[] = [
    {
      label: "Paintings",
      value: `${getNumber(paintingCount.total, 0)}`,
    },
    {
      label: "Hikes",
      value: `${getNumber(hikeCount.total, 0)}`,
    },
    {
      label: "Posts",
      value: `${getNumber(asRecord(summary.personal).posts_count || asRecord(summary.personal).posts, 0)}`,
    },
  ];

  const recoveryLines: SummaryLine[] = [
    {
      label: "Self-check",
      value: `${getNumber(lastSelfCheck.energy, 0)}/${getNumber(lastSelfCheck.sleepQuality || lastSelfCheck.sleep_quality, 0)}/${getNumber(lastSelfCheck.relationshipQuality || lastSelfCheck.relationship_quality, 0)}/${getNumber(lastSelfCheck.workSatisfaction || lastSelfCheck.work_satisfaction, 0)}`,
    },
    {
      label: "Journaling streak",
      value: `${getNumber(journalingStreak.currentStreak || journalingStreak.current_streak, 0)} day current`,
    },
    {
      label: "Recovery note",
      value: getString(journalingStreak.lastCompletedDate || journalingStreak.last_completed_date, "Steady"),
    },
  ];

  const activityWall = (dashboard.activityWall ?? {}) as Record<string, { count: number; labels: string[] }>;

  return (
    <>
      <div className="grid gap-6">
        <section className="card relative overflow-hidden px-6 py-8 md:px-8 md:py-10">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,143,255,0.28),transparent_65%)] blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-text-muted)]">Mission control</p>
              <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-none text-white md:text-7xl">
                The long climb to <span className="gradient-text">Ironman day</span>.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)] md:text-base">
                Peak 38 turns a 26-month transformation into a readable signal: countdowns, checkpoints, pillars, and daily proof.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.75rem] border border-white/8 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">Ironman countdown</p>
                <p className="metric-font mt-4 text-6xl font-semibold tracking-tight text-white md:text-7xl">{countdownDays}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">days until {formatDate(ironmanDate)}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/8 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">Next checkpoint</p>
                <p className="mt-3 text-2xl font-semibold text-white">{getString(nextCheckpoint.label || nextCheckpoint.name, "Awaiting schedule")}</p>
                <p className="metric-font mt-4 text-3xl text-[var(--color-accent-blue)]">{checkpointDays} days</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{formatDate(checkpointDate)}</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading dashboard…</div> : null}
        {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

        <ActivityWall activityMap={activityWall} />

        <JournalWidget onLogged={handleSuccess} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Physical" accent="from-[var(--color-accent-blue)] via-[var(--color-accent-green)] to-transparent" lines={physicalLines} onLog={() => openLog("physical")} />
          <SummaryCard title="Mind" accent="from-[var(--color-accent-purple)] via-[var(--color-accent-pink)] to-transparent" lines={mindLines} onLog={() => openLog("mind")} />
          <SummaryCard title="Personal" accent="from-[var(--color-accent-orange)] via-[var(--color-accent-pink)] to-transparent" lines={personalLines} onLog={() => openLog("personal")} />
          <SummaryCard title="Recovery" accent="from-[var(--color-accent-green)] via-[var(--color-accent-blue)] to-transparent" lines={recoveryLines} onLog={() => openLog("recovery")} />
        </section>
      </div>

      <button
        type="button"
        onClick={() => { setModalPrefill(undefined); setOpenModal(true); }}
        className="btn-primary fixed bottom-28 right-4 z-30 md:bottom-8 md:right-8"
      >
        Log something
      </button>

      <LogEntryModal isOpen={openModal} onClose={() => setOpenModal(false)} onSuccess={handleSuccess} prefill={modalPrefill} />
    </>
  );
}
