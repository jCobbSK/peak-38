"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchCheckpoints } from "@/lib/api";
import { extractCollection, formatDate, getBoolean, getString } from "@/lib/utils";

type CheckpointItem = Record<string, unknown>;

function getStatus(checkpoint: CheckpointItem, currentId: string): "upcoming" | "in-progress" | "complete" {
  const status = getString(checkpoint.status).toLowerCase();
  if (status === "complete" || getBoolean(checkpoint.complete) || getBoolean(checkpoint.completed) || getBoolean(checkpoint.isComplete)) return "complete";
  if (status === "in-progress" || getBoolean(checkpoint.current) || getBoolean(checkpoint.isCurrent) || getString(checkpoint.id) === currentId) return "in-progress";
  return "upcoming";
}

const badgeStyles = {
  upcoming: "border-white/10 bg-white/5 text-[var(--color-text-secondary)]",
  "in-progress": "border-[var(--color-accent-blue)]/30 bg-[rgba(79,143,255,0.12)] text-[var(--color-accent-blue)]",
  complete: "border-[var(--color-accent-green)]/30 bg-[rgba(16,185,129,0.12)] text-[var(--color-accent-green)]",
};

export default function CheckpointsPage() {
  const [items, setItems] = useState<CheckpointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetchCheckpoints();
        if (active) setItems(extractCollection<CheckpointItem>(response, ["checkpoints", "items"]));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load checkpoints");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const currentId = useMemo(
    () =>
      getString(
        items.find((item) => !getBoolean(item.isComplete) && !getBoolean(item.complete) && !getBoolean(item.completed))?.id,
      ),
    [items],
  );

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Checkpoints</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">13 markers on the mountain.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">A vertical timeline that shows what is already locked in, what is currently live, and what still waits uptrail.</p>
      </section>

      {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading checkpoints…</div> : null}
      {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

      <div className="relative pl-7 before:absolute before:bottom-0 before:left-2 before:top-0 before:w-px before:bg-white/10">
        {items.map((checkpoint) => {
          const status = getStatus(checkpoint, currentId);
          const current = status === "in-progress";
          const id = getString(checkpoint.id);
          const label = getString(checkpoint.label || checkpoint.name, "Unnamed checkpoint");
          const description = getString(checkpoint.description || checkpoint.summary, "No description yet.");

          return (
            <Link key={id || label} href={`/checkpoints/${id}`} className="group relative mb-4 block last:mb-0">
              <span className={`absolute -left-[1.78rem] top-8 grid h-6 w-6 place-items-center rounded-full border ${status === "complete" ? "border-[var(--color-accent-green)]/30 bg-[rgba(16,185,129,0.14)] text-[var(--color-accent-green)]" : current ? "border-[var(--color-accent-blue)]/30 bg-[rgba(79,143,255,0.18)] text-[var(--color-accent-blue)]" : "border-white/10 bg-[var(--color-bg-primary)] text-[var(--color-text-muted)]"}`}>
                {status === "complete" ? "✓" : status === "in-progress" ? "●" : "○"}
              </span>
              <article className={`card transition group-hover:-translate-y-0.5 ${current ? "border-[var(--color-accent-blue)]/35 shadow-[0_24px_60px_rgba(79,143,255,0.12)]" : ""}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(getString(checkpoint.date))}</p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{label}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">{description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeStyles[status]}`}>{status}</span>
                    <span className="text-sm text-[var(--color-text-muted)]">Open →</span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
