"use client";

import { useMemo } from "react";

type ActivityDay = {
  count: number;
  labels: string[];
};

type ActivityWallProps = {
  activityMap: Record<string, ActivityDay>;
};

type CellData = {
  dateKey: string;
  displayDate: string;
  count: number;
  intensity: number;
  labels: string[];
  isFuture: boolean;
};

const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatNiceDate(dateKey: string): string {
  const parts = dateKey.split("-");
  const month = monthNames[parseInt(parts[1], 10) - 1];
  const day = parseInt(parts[2], 10);
  const year = parts[0];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(parseInt(year, 10), parseInt(parts[1], 10) - 1, day);
  return `${weekdays[d.getDay()]}, ${month} ${day}, ${year}`;
}

export default function ActivityWall({ activityMap }: ActivityWallProps) {
  const { weeks, monthMarkers, totalActivities, todayKey } = useMemo(() => {
    const now = new Date();
    const today = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

    // Fixed range: Mon May 25, 2026 → Sun Aug 6, 2028 (full weeks ending after Aug 2, 2028)
    const startDate = new Date(2026, 4, 25); // Mon May 25, 2026
    const targetEnd = new Date(2028, 7, 2); // Aug 2, 2028
    // Extend to end of that week (Sunday)
    const targetDay = targetEnd.getDay();
    const daysToSunday = targetDay === 0 ? 0 : 7 - targetDay;
    const endDate = new Date(2028, 7, 2 + daysToSunday);

    const cells: CellData[] = [];
    let total = 0;
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = formatDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      const isFuture = dateKey > today;
      const dayData = activityMap[dateKey];
      const count = isFuture ? 0 : (dayData?.count ?? 0);
      const labels = isFuture ? [] : (dayData?.labels ?? []);
      total += count;

      cells.push({
        dateKey,
        displayDate: formatNiceDate(dateKey),
        count,
        intensity: isFuture ? -1 : getIntensity(count),
        labels,
        isFuture,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // Group into weeks (7 cells per column, Mon first)
    const grouped: CellData[][] = [];
    cells.forEach((cell, index) => {
      const weekIndex = Math.floor(index / 7);
      if (!grouped[weekIndex]) grouped[weekIndex] = [];
      grouped[weekIndex].push(cell);
    });

    // Month markers based on first Monday of each month
    const markers: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    grouped.forEach((week, weekIndex) => {
      const firstCell = week[0];
      if (firstCell) {
        const month = parseInt(firstCell.dateKey.split("-")[1], 10) - 1;
        if (month !== lastMonth) {
          markers.push({ label: monthNames[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return { weeks: grouped, monthMarkers: markers, totalActivities: total, todayKey: today };
  }, [activityMap]);

  return (
    <div className="card overflow-x-auto">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Activity</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-white">
            {totalActivities} contributions in the last year
          </h3>
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
                    ? "bg-[rgba(79,143,255,0.22)]"
                    : level === 2
                      ? "bg-[rgba(79,143,255,0.40)]"
                      : level === 3
                        ? "bg-[rgba(79,143,255,0.62)]"
                        : "bg-[rgba(79,143,255,0.90)]"
              }`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="mb-1 flex">
        <div className="w-8 shrink-0" />
        <div className="flex gap-1">
          {weeks.map((_, weekIndex) => {
            const marker = monthMarkers.find((m) => m.weekIndex === weekIndex);
            return (
              <div key={weekIndex} className="w-3.5 text-center">
                {marker ? (
                  <span className="text-[10px] text-[var(--color-text-muted)]">{marker.label}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="grid gap-1 text-[10px] text-[var(--color-text-muted)]">
          {dayLabels.map((label, i) => (
            <span key={i} className="flex h-3.5 w-6 items-center">{label}</span>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, index) => (
            <div key={index} className="grid gap-1">
              {week.map((cell) => {
                if (cell.isFuture) {
                  return (
                    <div
                      key={cell.dateKey}
                      className="h-3.5 w-3.5 rounded-[3px] border border-white/4 bg-transparent"
                    />
                  );
                }
                const uniqueLabels = [...new Set(cell.labels)];
                const isToday = cell.dateKey === todayKey;
                const tooltip = cell.count > 0
                  ? `${cell.displayDate}${isToday ? " (today)" : ""}\n${cell.count} ${cell.count === 1 ? "activity" : "activities"}: ${uniqueLabels.join(", ")}`
                  : `${cell.displayDate}${isToday ? " (today)" : ""}\nNo activities`;
                return (
                  <div
                    key={cell.dateKey}
                    title={tooltip}
                    className={`h-3.5 w-3.5 rounded-[3px] border transition hover:scale-125 ${
                      isToday ? "ring-1 ring-white/50 " : ""
                    }${
                      cell.intensity === 0
                        ? "border-white/6 bg-white/4"
                        : cell.intensity === 1
                          ? "border-white/6 bg-[rgba(79,143,255,0.22)]"
                          : cell.intensity === 2
                            ? "border-white/6 bg-[rgba(79,143,255,0.40)]"
                            : cell.intensity === 3
                              ? "border-white/6 bg-[rgba(79,143,255,0.62)]"
                              : "border-white/6 bg-[rgba(79,143,255,0.90)]"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
