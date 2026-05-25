"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchEntries, fetchSelfChecks } from "@/lib/api";
import HabitHeatmap from "@/components/HabitHeatmap";
import LogEntryModal from "@/components/LogEntryModal";
import ProofLink from "@/components/ProofLink";
import { asRecord, extractCollection, formatDate, getString, valueFromEntry } from "@/lib/utils";

type DataRecord = Record<string, unknown>;

export default function RecoveryPillarPage() {
  const [entries, setEntries] = useState<DataRecord[]>([]);
  const [selfChecks, setSelfChecks] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPrefill, setModalPrefill] = useState<{ pillar: string; category: string; metric_key: string } | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const openLog = (pillar: string, category: string, metric_key: string) =>
    setModalPrefill({ pillar, category, metric_key });

  const handleSuccess = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [entryResponse, selfCheckResponse] = await Promise.all([fetchEntries({ pillar: "recovery" }), fetchSelfChecks()]);
        if (!active) return;
        setEntries(extractCollection<DataRecord>(entryResponse, ["entries", "items"]));
        setSelfChecks(extractCollection<DataRecord>(selfCheckResponse, ["selfChecks", "items", "entries"]));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load recovery pillar");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const chartData = useMemo(
    () =>
      selfChecks.map((check) => ({
        date: formatDate(getString(check.week_date || check.weekDate || check.logged_at)),
        energy: Number(check.energy ?? 0),
        sleepQuality: Number(check.sleep_quality ?? check.sleepQuality ?? 0),
        relationshipQuality: Number(check.relationship_quality ?? check.relationshipQuality ?? 0),
        workSatisfaction: Number(check.work_satisfaction ?? check.workSatisfaction ?? 0),
      })),
    [selfChecks],
  );

  const boundaryCards = entries.filter((entry) => {
    const category = getString(entry.category).toLowerCase();
    return category === "boundaries" || category === "sleep";
  });
  const socialPhysical = entries.filter((entry) => getString(entry.category).toLowerCase() === "social_physical");

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Recovery pillar</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">Protect the system that does the work.</h1>
      </section>

      {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading recovery pillar…</div> : null}
      {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

      <section className="card">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Self-check trends</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Four signals over time</h2>
          </div>
          <button type="button" onClick={() => openLog("recovery", "self_check", "energy")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(153,153,176,0.7)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(153,153,176,0.7)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }} />
              <Line type="monotone" dataKey="energy" stroke="#4f8fff" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="sleepQuality" stroke="#10b981" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="relationshipQuality" stroke="#ec4899" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="workSatisfaction" stroke="#f59e0b" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <HabitHeatmap habitKey="transition-ritual" />

      <section className="grid gap-4 lg:grid-cols-2">
        {boundaryCards.map((entry, index) => (
          <article key={`${getString(entry.metric_key || entry.metricKey)}-${index}`} className="card">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Boundary status</p>
              <button type="button" onClick={() => openLog("recovery", "boundaries", "boundary_score")} className="btn-secondary !px-3 !py-1 text-xs">Log</button>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">{getString(entry.value_text || entry.notes, getString(entry.metric_key || entry.metricKey, `Boundary ${index + 1}`))}</h2>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Logged {formatDate(getString(entry.entry_date || entry.entryDate || entry.logged_at))}</p>
            <p className="metric-font mt-4 text-3xl text-[var(--color-accent-green)]">{String(valueFromEntry(asRecord(entry)) ?? "—")}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Social / physical</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{socialPhysical.length} shared moments</h2>
          </div>
          <button type="button" onClick={() => openLog("recovery", "social_physical", "social_physical")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
        </div>
        <div className="space-y-3">
          {socialPhysical.map((entry, index) => (
            <div key={`${getString(entry.value_text)}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">{getString(entry.value_text || entry.notes, `Moment ${index + 1}`)}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(getString(entry.entry_date || entry.entryDate || entry.logged_at))}</p>
              </div>
              <ProofLink url={getString(entry.proof_url)} label="Proof" />
            </div>
          ))}
        </div>
      </section>

      <LogEntryModal isOpen={!!modalPrefill} onClose={() => setModalPrefill(undefined)} onSuccess={handleSuccess} prefill={modalPrefill} />
    </div>
  );
}
