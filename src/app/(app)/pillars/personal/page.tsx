"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchEntries } from "@/lib/api";
import HabitHeatmap from "@/components/HabitHeatmap";
import LogEntryModal from "@/components/LogEntryModal";
import ProofLink from "@/components/ProofLink";
import { extractCollection, formatDate, getString } from "@/lib/utils";

type DataRecord = Record<string, unknown>;

export default function PersonalPillarPage() {
  const [entries, setEntries] = useState<DataRecord[]>([]);
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
        const response = await fetchEntries({ pillar: "personal" });
        if (active) setEntries(extractCollection<DataRecord>(response, ["entries", "items"]));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load personal pillar");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const paintings = entries.filter((entry) => getString(entry.category).toLowerCase() === "paintings");
  const hikes = entries.filter((entry) => getString(entry.category).toLowerCase() === "hikes");
  const dates = entries.filter((entry) => getString(entry.category).toLowerCase() === "dates");

  const paintingGallery = useMemo(
    () =>
      paintings.map((painting, index) => ({
        title: getString(painting.value_text || painting.notes, `Painting ${index + 1}`),
        image: getString(painting.proof_url),
      })),
    [paintings],
  );

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Personal pillar</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">Keep the life outside training vivid.</h1>
      </section>

      {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading personal pillar…</div> : null}
      {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

      <section className="card">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Paintings</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{paintings.length}/26 complete</h2>
          </div>
          <button type="button" onClick={() => openLog("personal", "paintings", "painting_complete")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paintingGallery.map((painting) => (
            <article key={painting.title} className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-black/20">
              {painting.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={painting.image} alt={painting.title} className="h-48 w-full object-cover" />
              ) : (
                <div className="grid h-48 place-items-center bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.25),transparent_50%),rgba(255,255,255,0.04)] text-[var(--color-text-secondary)]">Awaiting proof</div>
              )}
              <div className="p-4">
                <p className="font-medium text-white">{painting.title}</p>
                <div className="mt-3"><ProofLink url={painting.image} label="View" /></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Hikes</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{hikes.length} logged</h2>
            </div>
            <button type="button" onClick={() => openLog("personal", "hikes", "hike_complete")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
          </div>
          <div className="space-y-3">
            {hikes.map((hike, index) => (
              <div key={`${getString(hike.value_text)}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">{getString(hike.value_text || hike.notes, `Hike ${index + 1}`)}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(getString(hike.entry_date || hike.entryDate || hike.logged_at))}</p>
                </div>
                <ProofLink url={getString(hike.proof_url)} label="Route" />
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Weekly dates</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{dates.length}/104 logged</h2>
            </div>
            <button type="button" onClick={() => openLog("personal", "dates", "weekly_date")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
          </div>
          <div className="space-y-3">
            {dates.map((dateEntry, index) => (
              <div key={`${getString(dateEntry.value_text)}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <p className="font-medium text-white">{getString(dateEntry.value_text || dateEntry.notes, `Date ${index + 1}`)}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatDate(getString(dateEntry.entry_date || dateEntry.entryDate || dateEntry.logged_at))}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <HabitHeatmap habitKey="journaling" refreshKey={refreshKey} />

      <LogEntryModal isOpen={!!modalPrefill} onClose={() => setModalPrefill(undefined)} onSuccess={handleSuccess} prefill={modalPrefill} />
    </div>
  );
}
