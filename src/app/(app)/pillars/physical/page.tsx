"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchConfig, fetchCheckpoints, fetchEntries } from "@/lib/api";
import LogEntryModal from "@/components/LogEntryModal";
import ProofLink from "@/components/ProofLink";
import {
  asArray,
  asRecord,
  extractCollection,
  formatDate,
  formatTime,
  getString,
  slugToLabel,
  valueFromEntry,
} from "@/lib/utils";

type DataRecord = Record<string, unknown>;

function obj(v: unknown): DataRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as DataRecord) : {};
}

function cpEntry(checkpoints: unknown, cpId: string): DataRecord | null {
  const map = obj(checkpoints);
  const entry = map[cpId];
  return typeof entry === "object" && entry !== null && !Array.isArray(entry) ? (entry as DataRecord) : null;
}

function fmtTarget(seconds: number | null, display: string): string {
  if (display) return display;
  if (seconds !== null) return formatTime(seconds);
  return "—";
}

function fmtActual(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number") return formatTime(v);
  return String(v);
}

export default function PhysicalPillarPage() {
  const [entries, setEntries] = useState<DataRecord[]>([]);
  const [checkpoints, setCheckpoints] = useState<DataRecord[]>([]);
  const [configData, setConfigData] = useState<DataRecord>({});
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
        const [entryRes, cpRes, cfgRes] = await Promise.all([
          fetchEntries({ pillar: "physical" }),
          fetchCheckpoints(),
          fetchConfig(),
        ]);
        if (!active) return;
        setEntries(extractCollection<DataRecord>(entryRes, ["entries", "items"]));
        setCheckpoints(extractCollection<DataRecord>(cpRes, ["checkpoints", "items"]));
        setConfigData(obj(obj(obj(cfgRes).config).data));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load physical pillar");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [refreshKey]);

  const physical = useMemo(() => obj(obj(configData.pillars).physical), [configData]);

  // ── Strength ──────────────────────────────────────────────────────────────
  const liftCards = useMemo(() => {
    const lifts = asArray<DataRecord>(obj(physical.strength).lifts);
    return lifts.map((lift) => {
      const liftKey = getString(lift.key);
      const unit = getString(lift.unit, "kg");
      const liftEntries = entries.filter((e) => getString(e.metricKey ?? e.metric_key) === liftKey);
      const rows = checkpoints
        .map((cp) => {
          const cpId = getString(cp.id);
          const cp_ = cpEntry(lift.checkpoints, cpId);
          if (!cp_) return null;
          const logged = liftEntries.find((e) => getString(e.checkpointId ?? e.checkpoint_id) === cpId);
          return {
            cpId,
            checkpoint: getString(cp.label ?? cp.name, cpId),
            target: typeof cp_.target === "number" ? cp_.target : null,
            note: typeof cp_.note === "string" ? cp_.note : null,
            logged: logged ? valueFromEntry(asRecord(logged)) : undefined,
          };
        })
        .filter(Boolean) as { cpId: string; checkpoint: string; target: number | null; note: string | null; logged: unknown }[];

      const latest = liftEntries[0] ? valueFromEntry(asRecord(liftEntries[0])) : undefined;
      return { liftKey, label: getString(lift.label, slugToLabel(liftKey)), unit, latest, rows };
    });
  }, [physical, checkpoints, entries]);

  // ── Bodyweight ────────────────────────────────────────────────────────────
  const bwPoints = useMemo(() => {
    const bwCfg = obj(physical.bodyweight);
    const bwEntries = entries.filter((e) => getString(e.metricKey ?? e.metric_key) === "bodyweight");

    return checkpoints
      .map((cp) => {
        const cpId = getString(cp.id);
        const cp_ = cpEntry(bwCfg.checkpoints, cpId);
        if (!cp_) return null;
        const target = typeof cp_.target === "number" ? cp_.target : null;
        const logged = bwEntries.find((e) => getString(e.checkpointId ?? e.checkpoint_id) === cpId);
        const actual = logged ? Number(valueFromEntry(asRecord(logged)) ?? null) : null;
        return {
          date: formatDate(getString(cp.date)),
          label: getString(cp.label ?? cp.name, cpId),
          target,
          actual: Number.isFinite(actual) ? actual : null,
        };
      })
      .filter(Boolean) as { date: string; label: string; target: number | null; actual: number | null }[];
  }, [physical, checkpoints, entries]);

  // ── Endurance ─────────────────────────────────────────────────────────────
  const endurance = useMemo(() => {
    const endCfg = obj(physical.endurance);

    const races = asArray<DataRecord>(endCfg.races).map((race) => {
      const key = getString(race.key);
      const logged = entries.find((e) => getString(e.metricKey ?? e.metric_key) === key);
      return {
        key,
        label: getString(race.label, key),
        distanceKm: typeof race.distance_km === "number" ? race.distance_km : null,
        date: getString(race.date),
        location: getString(race.location),
        targetSeconds: typeof race.target_seconds === "number" ? race.target_seconds : null,
        targetDisplay: getString(race.target_display),
        logged: logged ? valueFromEntry(asRecord(logged)) : undefined,
        proofUrl: logged ? getString(asRecord(logged).proofUrl ?? asRecord(logged).proof_url) : "",
      };
    });

    const selfOrganized = asArray<DataRecord>(endCfg.self_organized).map((ev) => {
      const key = getString(ev.key);
      const cpId = getString(ev.checkpoint_id);
      const cp = checkpoints.find((c) => getString(c.id) === cpId);
      const logged = entries.find((e) => getString(e.metricKey ?? e.metric_key) === key);
      return {
        key,
        label: getString(ev.label, key),
        distanceKm: typeof ev.distance_km === "number" ? ev.distance_km : null,
        checkpointLabel: cp ? getString(cp.label ?? cp.name, cpId) : cpId,
        targetSeconds: typeof ev.target_seconds === "number" ? ev.target_seconds : null,
        targetDisplay: getString(ev.target_display),
        logged: logged ? valueFromEntry(asRecord(logged)) : undefined,
        proofUrl: logged ? getString(asRecord(logged).proofUrl ?? asRecord(logged).proof_url) : "",
      };
    });

    return { races, selfOrganized };
  }, [physical, checkpoints, entries]);

  // ── Mobility ──────────────────────────────────────────────────────────────
  const mobilityRows = useMemo(() => {
    const tests = asArray<DataRecord>(obj(physical.mobility).tests);
    return tests.flatMap((test) => {
      const key = getString(test.key);
      const unit = getString(test.unit);
      const latestEntry = entries.find((e) => getString(e.metricKey ?? e.metric_key) === key);
      const actual = latestEntry ? valueFromEntry(asRecord(latestEntry)) : undefined;
      const cpMap = obj(test.checkpoints);
      return Object.entries(cpMap)
        .filter(([, v]) => v !== null && typeof v === "object")
        .map(([cpId, v]) => {
          const cp = checkpoints.find((c) => getString(c.id) === cpId);
          return {
            key,
            label: getString(test.label, slugToLabel(key)),
            checkpoint: cp ? getString(cp.label ?? cp.name, cpId) : cpId,
            target: (v as DataRecord).target,
            unit,
            actual,
          };
        });
    });
  }, [physical, checkpoints, entries]);

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Physical pillar</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">Train like the horizon matters.</h1>
      </section>

      {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading physical data…</div> : null}
      {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

      {/* ── Strength ─────────────────────────────────────────────────────── */}
      {liftCards.length > 0 && (
        <section className="grid gap-4 xl:grid-cols-2">
          {liftCards.map((card) => (
            <article key={card.liftKey} className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Strength</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{card.label}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => openLog("physical", "strength", card.liftKey)} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
                  <p className="metric-font text-right text-2xl text-[var(--color-accent-blue)]">
                    {card.latest !== undefined ? `${card.latest} ${card.unit}` : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-white/8">
                <table className="w-full text-sm">
                  <thead className="bg-white/4 text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Checkpoint</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.rows.map((row) => (
                      <tr key={`${card.liftKey}-${row.cpId}`} className="border-t border-white/6">
                        <td className="px-4 py-3 text-white">{row.checkpoint}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {row.target !== null ? `${row.target} ${card.unit}` : "—"}
                          {row.note ? <span className="ml-2 text-xs text-[var(--color-text-muted)]">({row.note})</span> : null}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {row.logged !== undefined ? `${row.logged} ${card.unit}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ── Bodyweight ───────────────────────────────────────────────────── */}
      <section className="card">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Bodyweight</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Actual vs target curve</h2>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => openLog("physical", "bodyweight", "bodyweight")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
            {bwPoints.length > 0 && (
              <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-2"><span className="inline-block h-0.5 w-6 bg-[var(--color-accent-blue)]" />Actual</span>
                <span className="flex items-center gap-2"><span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-[var(--color-accent-green)]" />Target</span>
              </div>
            )}
          </div>
        </div>
        {bwPoints.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <LineChart data={bwPoints}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(153,153,176,0.7)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="rgba(153,153,176,0.7)" tickLine={false} axisLine={false} domain={["auto", "auto"]} unit=" kg" />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                  formatter={(val: number, name: string) => [`${val} kg`, name === "actual" ? "Logged" : "Target"]}
                />
                <Line type="monotone" dataKey="actual" stroke="#4f8fff" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
                <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">No bodyweight targets found in config.</p>
        )}
        {bwPoints.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-white/8">
            <table className="w-full text-sm">
              <thead className="bg-white/4 text-left text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Checkpoint</th>
                  <th className="px-4 py-3 font-medium">Target (kg)</th>
                  <th className="px-4 py-3 font-medium">Logged (kg)</th>
                </tr>
              </thead>
              <tbody>
                {bwPoints.map((pt) => (
                  <tr key={pt.date} className="border-t border-white/6">
                    <td className="px-4 py-3 text-white">{pt.label}</td>
                    <td className="px-4 py-3 text-[var(--color-accent-green)]">{pt.target ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{pt.actual ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Endurance / Running ──────────────────────────────────────────── */}
      <section className="card">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Endurance</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Races &amp; benchmark efforts</h2>
          </div>
          <button type="button" onClick={() => openLog("physical", "races", "race_result")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
        </div>

        {endurance.races.length > 0 && (
          <>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Registered races</p>
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {endurance.races.map((race) => (
                <article key={race.key} className="rounded-[1.5rem] border border-white/8 bg-white/4 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                    {race.distanceKm !== null ? `${race.distanceKm} km` : "Race"}
                    {race.location ? ` · ${race.location}` : ""}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{race.label}</h3>
                  {race.date ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatDate(race.date)}</p> : null}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Target</p>
                      <p className="metric-font mt-1 text-xl text-[var(--color-accent-green)]">{fmtTarget(race.targetSeconds, race.targetDisplay)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Result</p>
                      <p className="metric-font mt-1 text-xl text-white">{fmtActual(race.logged)}</p>
                    </div>
                  </div>
                  {race.proofUrl ? <div className="mt-4"><ProofLink url={race.proofUrl} label="Result link" /></div> : null}
                </article>
              ))}
            </div>
          </>
        )}

        {endurance.selfOrganized.length > 0 && (
          <>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Self-organised benchmarks</p>
            <div className="overflow-hidden rounded-[1.25rem] border border-white/8">
              <table className="w-full text-sm">
                <thead className="bg-white/4 text-left text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Effort</th>
                    <th className="px-4 py-3 font-medium">Distance</th>
                    <th className="px-4 py-3 font-medium">Checkpoint</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {endurance.selfOrganized.map((ev) => (
                    <tr key={ev.key} className="border-t border-white/6">
                      <td className="px-4 py-3 text-white">{ev.label}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{ev.distanceKm !== null ? `${ev.distanceKm} km` : "—"}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{ev.checkpointLabel}</td>
                      <td className="px-4 py-3 text-[var(--color-accent-green)]">{fmtTarget(ev.targetSeconds, ev.targetDisplay)}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{fmtActual(ev.logged)}</td>
                      <td className="px-4 py-3">{ev.proofUrl ? <ProofLink url={ev.proofUrl} label="↗" /> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ── Mobility ─────────────────────────────────────────────────────── */}
      {mobilityRows.length > 0 && (
        <section className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Mobility</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Tests and checkpoint targets</h2>
            </div>
            <button type="button" onClick={() => openLog("physical", "mobility", "ankle_mobility")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
          </div>
          <div className="overflow-hidden rounded-[1.25rem] border border-white/8">
            <table className="w-full text-sm">
              <thead className="bg-white/4 text-left text-[var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Test</th>
                  <th className="px-4 py-3 font-medium">Checkpoint</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Logged</th>
                </tr>
              </thead>
              <tbody>
                {mobilityRows.map((row, i) => (
                  <tr key={`${row.key}-${row.checkpoint}-${i}`} className="border-t border-white/6">
                    <td className="px-4 py-3 text-white">{row.label}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.checkpoint}</td>
                    <td className="px-4 py-3 text-[var(--color-accent-green)]">{row.target !== undefined ? String(row.target) : "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{slugToLabel(row.unit)}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{row.actual !== undefined ? String(row.actual) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <LogEntryModal isOpen={!!modalPrefill} onClose={() => setModalPrefill(undefined)} onSuccess={handleSuccess} prefill={modalPrefill} />
    </div>
  );
}

