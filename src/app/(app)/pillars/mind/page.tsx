"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createEntry, fetchConfig, fetchDashboard, fetchEntries, updateEntry, updateProductLabel } from "@/lib/api";
import LogEntryModal from "@/components/LogEntryModal";
import ProofLink from "@/components/ProofLink";
import { asRecord, dateInputValue, extractCollection, formatDate, getString, slugToLabel } from "@/lib/utils";

type DataRecord = Record<string, unknown>;

function ProgressBar({ label, count, target }: { label: string; count: number; target: number }) {
  const percentage = Math.min(100, Math.round((count / target) * 100));

  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        <span className="metric-font text-white">{count}/{target}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/6">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent-purple),var(--color-accent-blue))]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

type InlineTitleProps = {
  value: string;
  onSave: (next: string) => Promise<void>;
};

function InlineTitle({ value, onSave }: InlineTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setDraft(value);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="mt-2 w-full rounded-lg border border-white/20 bg-white/8 px-2 py-1 text-2xl font-semibold text-white outline-none focus:border-[var(--color-accent-blue)] disabled:opacity-50"
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
      />
    );
  }

  return (
    <h2
      className="mt-2 cursor-pointer text-2xl font-semibold text-white hover:opacity-75"
      title="Click to rename"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </h2>
  );
}

type ProductMilestone = {
  id: number;
  label: string;
  done: boolean;
  completedAt?: string;
};

type ProductData = {
  productKey: string;
  title: string;
  phase: string;
  milestones: ProductMilestone[];
};

function ProductCard({
  product,
  onToggleMilestone,
  onAddMilestone,
  onRename,
}: {
  product: ProductData;
  onToggleMilestone: (id: number, currentDone: boolean) => Promise<void>;
  onAddMilestone: (label: string) => Promise<void>;
  onRename: (next: string) => Promise<void>;
}) {
  const [newMilestone, setNewMilestone] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleAdd = async () => {
    if (!newMilestone.trim()) return;
    setAdding(true);
    try {
      await onAddMilestone(newMilestone.trim());
      setNewMilestone("");
      setShowInput(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Products</p>
      </div>
      <InlineTitle value={product.title} onSave={onRename} />
      <p className="mt-2 text-sm text-[var(--color-accent-blue)]">{product.phase}</p>
      <div className="mt-5 space-y-3">
        {product.milestones.map((milestone) => (
          <button
            key={`${product.productKey}-${milestone.id}`}
            type="button"
            onClick={() => void onToggleMilestone(milestone.id, milestone.done)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm transition hover:border-white/16"
          >
            <span className={milestone.done ? "text-[var(--color-text-secondary)] line-through" : "text-white"}>
              {milestone.label}
              {milestone.done && milestone.completedAt && (
                <span className="ml-2 text-xs text-[var(--color-text-muted)]">({milestone.completedAt})</span>
              )}
            </span>
            <span className={milestone.done ? "text-[var(--color-accent-green)]" : "text-[rgba(239,68,68,0.82)]"}>{milestone.done ? "✓" : "⚑"}</span>
          </button>
        ))}
        {product.milestones.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">No milestones yet</p>
        )}
      </div>
      <div className="mt-4">
        {showInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); if (e.key === "Escape") setShowInput(false); }}
              placeholder="Milestone name…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-blue)]/40"
              autoFocus
              disabled={adding}
            />
            <button type="button" onClick={handleAdd} disabled={adding || !newMilestone.trim()} className="btn-primary !px-3 !py-2 text-xs disabled:opacity-50">
              {adding ? "…" : "Add"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowInput(true)} className="text-sm text-[var(--color-accent-blue)] hover:underline">
            + Add milestone
          </button>
        )}
      </div>
    </article>
  );
}

export default function MindPillarPage() {
  const [entries, setEntries] = useState<DataRecord[]>([]);
  const [dashboard, setDashboard] = useState<DataRecord>({});
  const [configProducts, setConfigProducts] = useState<DataRecord[]>([]);
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
        const [entryResponse, dashboardResponse, configResponse] = await Promise.all([
          fetchEntries({ pillar: "mind" }),
          fetchDashboard(),
          fetchConfig(),
        ]);
        if (!active) return;
        setEntries(extractCollection<DataRecord>(entryResponse, ["entries", "items"]));
        setDashboard(asRecord(dashboardResponse));
        const cfg = asRecord(asRecord(configResponse).config);
        const cfgData = asRecord(cfg.data);
        const cfgPillars = asRecord(cfgData.pillars);
        const cfgMind = asRecord(cfgPillars.mind);
        setConfigProducts(Array.isArray(cfgMind.products) ? (cfgMind.products as DataRecord[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load mind pillar");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const productsSource = extractCollection<DataRecord>(asRecord(asRecord(dashboard.summary).mind).products ?? dashboard.products, ["items"]);
  const productCards = Array.from({ length: 3 }, (_, index) => {
    const source = productsSource[index] ?? {};
    const cfgProduct = configProducts[index] ?? {};
    const key = getString(cfgProduct.key, `product-${index + 1}`);
    const milestones = entries.filter((entry) => getString(entry.category).toLowerCase() === "products" && getString(entry.metric_key || entry.metricKey).includes(key));
    return {
      productKey: key,
      title: getString(cfgProduct.label || source.name, `Product ${String(index + 1).padStart(2, "0")}`),
      phase: getString(source.phase || asRecord(asRecord(dashboard.summary).mind).current_product_phase, "Discovery"),
      milestones: milestones.map((item) => ({
        id: item.id as number,
        label: getString(item.notes || item.value_text, "Milestone"),
        done: item.value_boolean === true || item.valueBoolean === true,
        completedAt: (item.value_boolean === true || item.valueBoolean === true)
          ? formatDate(getString(item.updated_at || item.updatedAt || item.entry_date || item.entryDate || item.logged_at))
          : undefined,
      })).reverse(),
    };
  });

  const readingEntries = entries.filter((entry) => getString(entry.category).toLowerCase() === "reading");
  const nonfiction = readingEntries.filter((entry) => {
    const notes = getString(entry.notes).toLowerCase();
    const metric = getString(entry.metric_key || entry.metricKey).toLowerCase();
    return metric.includes("nonfiction") || notes.includes("nonfiction") || (!metric.includes("fiction") && !notes.includes("fiction"));
  });
  const fiction = readingEntries.filter((entry) => {
    const notes = getString(entry.notes).toLowerCase();
    const metric = getString(entry.metric_key || entry.metricKey).toLowerCase();
    return (metric.includes("fiction") && !metric.includes("nonfiction")) || (notes.includes("fiction") && !notes.includes("nonfiction"));
  });

  const books = useMemo(
    () =>
      readingEntries
        .filter((entry) => typeof entry.value_text === "string" && entry.value_text)
        .map((entry) => ({
          title: getString(entry.value_text),
          date: formatDate(getString(entry.entry_date || entry.entryDate || entry.logged_at)),
          proof: getString(entry.proof_url),
        })),
    [readingEntries],
  );

  const skillEntries = entries.filter((entry) => getString(entry.category).toLowerCase() === "skills");
  const aliasPosts = entries.filter((entry) => getString(entry.category).toLowerCase() === "alias_posts");
  const careerStatus = getString(
    entries.find((entry) => getString(entry.category).toLowerCase() === "career")?.value_text || asRecord(asRecord(dashboard.summary).mind).career_status,
    "No status update logged yet",
  );

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Mind pillar</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">Build ideas with a cold sky overhead.</h1>
      </section>

      {loading ? <div className="card text-sm text-[var(--color-text-secondary)]">Loading mind pillar…</div> : null}
      {error ? <div className="card text-sm text-[var(--color-accent-red)]">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-3">
        {productCards.map((product) => (
          <ProductCard
            key={product.productKey}
            product={product}
            onToggleMilestone={async (id, done) => {
              await updateEntry(id, { value_boolean: !done });
              handleSuccess();
            }}
            onAddMilestone={async (label) => {
              await createEntry({
                pillar: "mind",
                category: "products",
                metric_key: `milestone_complete_${product.productKey}`,
                value_boolean: false,
                value_text: label,
                notes: label,
                entry_date: dateInputValue(),
              });
              handleSuccess();
            }}
            onRename={async (next) => {
              if (!product.productKey) return;
              await updateProductLabel(product.productKey, next);
              setConfigProducts((prev) =>
                prev.map((p) => (asRecord(p).key === product.productKey ? { ...asRecord(p), label: next } : p)),
              );
            }}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Reading</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Balanced input, year-round.</h2>
            </div>
            <button type="button" onClick={() => openLog("mind", "reading", "book_finished")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProgressBar label="Nonfiction" count={nonfiction.length} target={26} />
            <ProgressBar label="Fiction" count={fiction.length} target={26} />
          </div>
          <div className="mt-5 space-y-3">
            {books.map((book) => (
              <div key={`${book.title}-${book.date}`} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">{book.title}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{book.date}</p>
                </div>
                <ProofLink url={book.proof} label="Proof" />
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-4">
          <article className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Career</p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">Status</h2>
              </div>
              <button type="button" onClick={() => openLog("mind", "career", "career_status")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">{careerStatus}</p>
          </article>
          <article className="card">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Skills</p>
              <button type="button" onClick={() => openLog("mind", "skills", "skill_progress")} className="btn-secondary !px-3 !py-1 text-xs">Log</button>
            </div>
            <div className="mt-4 grid gap-3">
              {skillEntries.map((skill, index) => (
                <div key={`${getString(skill.metric_key || skill.metricKey)}-${index}`} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                  <p className="text-sm font-medium text-white">{slugToLabel(getString(skill.metric_key || skill.metricKey, `Skill ${index + 1}`))}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{getString(skill.value_text || skill.notes, "Tracking in progress")}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Alias posts</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{aliasPosts.length} posts logged</h2>
          </div>
          <button type="button" onClick={() => openLog("mind", "alias_posts", "alias_post")} className="btn-secondary !px-4 !py-2 text-sm">Log</button>
        </div>
        <div className="grid gap-3">
          {aliasPosts.map((post, index) => (
            <div key={`${getString(post.value_text)}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">{getString(post.value_text || post.notes, `Post ${index + 1}`)}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(getString(post.entry_date || post.entryDate || post.logged_at))}</p>
              </div>
              <ProofLink url={getString(post.proof_url)} label="Read" />
            </div>
          ))}
        </div>
      </section>

      <LogEntryModal isOpen={!!modalPrefill} onClose={() => setModalPrefill(undefined)} onSuccess={handleSuccess} prefill={modalPrefill} />
    </div>
  );
}
