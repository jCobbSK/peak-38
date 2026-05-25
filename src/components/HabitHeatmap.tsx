"use client";

import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek, subWeeks } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { fetchHabitLogs } from "@/lib/api";
import { asArray, asRecord, getBoolean, getNumber, getString } from "@/lib/utils";

type HabitHeatmapProps = {
  habitKey: string;
  refreshKey?: number;
};

type HabitCell = {
  date: Date;
  intensity: number;
  completed: boolean;
  note: string;
};

const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitHeatmap({ habitKey, refreshKey }: HabitHeatmapProps) {
  const [cells, setCells] = useState<HabitCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchHabitLogs(habitKey);
        const payload = asRecord(response);
        const logs = asArray<Record<string, unknown>>(payload.habitLogs ?? payload.logs ?? response);
        const start = startOfWeek(subWeeks(new Date(), 51), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        const nextCells = days.map((date) => {
          const match = logs.find((log) => isSameDay(new Date(getString(log.log_date || log.logDate || log.date || log.entry_date, date.toISOString())), date));
          const completed = match ? getBoolean(match.completed, true) : false;
          const intensity = match ? Math.min(4, Math.max(1, getNumber(match.intensity, completed ? 4 : 1))) : 0;

          return {
            date,
            intensity,
            completed,
            note: getString(match?.notes),
          };
        });

        if (active) setCells(nextCells);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load heatmap");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [habitKey, refreshKey]);

  const weeks = useMemo(() => {
    const grouped: HabitCell[][] = [];
    cells.forEach((cell, index) => {
      const weekIndex = Math.floor(index / 7);
      if (!grouped[weekIndex]) grouped[weekIndex] = [];
      grouped[weekIndex].push(cell);
    });
    return grouped;
  }, [cells]);

  if (loading) {
    return <div className="card text-sm text-[var(--color-text-secondary)]">Loading habit grid…</div>;
  }

  if (error) {
    return <div className="card text-sm text-[var(--color-accent-red)]">{error}</div>;
  }

  return (
    <div className="card overflow-x-auto">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Habit signal</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-white">{habitKey.replaceAll("-", " ")}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`h-3.5 w-3.5 rounded-sm border border-white/6 ${
                level === 0
                  ? "bg-white/4"
                  : level === 1
                    ? "bg-[rgba(16,185,129,0.22)]"
                    : level === 2
                      ? "bg-[rgba(16,185,129,0.38)]"
                      : level === 3
                        ? "bg-[rgba(16,185,129,0.58)]"
                        : "bg-[rgba(16,185,129,0.88)]"
              }`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="mt-6 grid gap-1 pr-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          {weekLabels.map((label, i) => (
            <span key={i} className="h-3.5 leading-3.5">{label}</span>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, index) => (
            <div key={`${habitKey}-${index}`} className="grid gap-1">
              {week.map((cell) => (
                <div
                  key={cell.date.toISOString()}
                  title={`${format(cell.date, "EEE, MMM d")}${cell.note ? ` — ${cell.note}` : ""}`}
                  className={`h-3.5 w-3.5 rounded-[3px] border border-white/6 transition hover:scale-110 ${
                    cell.intensity === 0
                      ? "bg-white/4"
                      : cell.intensity === 1
                        ? "bg-[rgba(16,185,129,0.22)]"
                        : cell.intensity === 2
                          ? "bg-[rgba(16,185,129,0.38)]"
                          : cell.intensity === 3
                            ? "bg-[rgba(16,185,129,0.58)]"
                            : "bg-[rgba(16,185,129,0.88)]"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
