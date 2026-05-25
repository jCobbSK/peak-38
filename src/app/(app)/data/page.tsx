"use client";

import { useEffect, useMemo, useState } from "react";
import { exportData, fetchConfig, importConfig } from "@/lib/api";
import { asRecord } from "@/lib/utils";

const modeLabels = {
  full_restore: "Full Restore",
  goal_update: "Goal Update",
} as const;

type ImportMode = keyof typeof modeLabels;

function normalizeImportedConfig(value: unknown) {
  const record = asRecord(value);
  if (record.config) {
    const configRecord = asRecord(record.config);
    return configRecord.data ?? record.config;
  }
  return value;
}

type DiffItem = {
  path: string;
  before: string;
  after: string;
};

function serialize(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function collectDiff(currentValue: unknown, nextValue: unknown, path = "root"): DiffItem[] {
  const currentIsObject = typeof currentValue === "object" && currentValue !== null;
  const nextIsObject = typeof nextValue === "object" && nextValue !== null;

  if (currentIsObject && nextIsObject && !Array.isArray(currentValue) && !Array.isArray(nextValue)) {
    const currentRecord = currentValue as Record<string, unknown>;
    const nextRecord = nextValue as Record<string, unknown>;
    const keys = new Set([...Object.keys(currentRecord), ...Object.keys(nextRecord)]);
    return Array.from(keys).flatMap((key) => collectDiff(currentRecord[key], nextRecord[key], `${path}.${key}`));
  }

  if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
    const length = Math.max(currentValue.length, nextValue.length);
    return Array.from({ length }).flatMap((_, index) => collectDiff(currentValue[index], nextValue[index], `${path}[${index}]`));
  }

  if (serialize(currentValue) !== serialize(nextValue)) {
    return [{ path, before: serialize(currentValue), after: serialize(nextValue) }];
  }

  return [];
}

export default function DataPage() {
  const [currentConfig, setCurrentConfig] = useState<unknown>(null);
  const [rawInput, setRawInput] = useState("");
  const [mode, setMode] = useState<ImportMode>("full_restore");
  const [parsedConfig, setParsedConfig] = useState<unknown>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetchConfig();
        if (active) setCurrentConfig(asRecord(asRecord(response).config).data ?? asRecord(response).config ?? response);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const diff = useMemo(() => {
    if (!parsedConfig) return [];
    const changes = collectDiff(currentConfig, parsedConfig);
    if (mode === "goal_update") {
      const goalChanges = changes.filter((item) => /target|goal/i.test(item.path));
      return goalChanges.length > 0 ? goalChanges : changes;
    }
    return changes;
  }, [currentConfig, mode, parsedConfig]);

  const handleExport = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `peak38-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Export downloaded.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to export data");
    } finally {
      setWorking(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRawInput(await file.text());
  };

  const handleParse = () => {
    setPreviewError(null);
    setMessage(null);
    try {
      setParsedConfig(normalizeImportedConfig(JSON.parse(rawInput)));
    } catch (err) {
      setParsedConfig(null);
      setPreviewError(err instanceof Error ? err.message : "Unable to parse JSON");
    }
  };

  const handleApply = async () => {
    if (!parsedConfig) return;
    setWorking(true);
    setMessage(null);
    try {
      await importConfig(mode, parsedConfig);
      setMessage("Config applied successfully.");
      setCurrentConfig(parsedConfig);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to apply import");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Import / Export</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">Move the whole configuration with confidence.</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={handleExport} disabled={working} className="btn-primary disabled:opacity-60">Export JSON</button>
          <span className="rounded-full border border-white/10 px-4 py-3 text-sm text-[var(--color-text-secondary)]">{loading ? "Loading current config…" : "Current config loaded"}</span>
        </div>
      </section>

      <section className="card grid gap-5">
        <div className="grid gap-4 md:grid-cols-[0.6fr_0.4fr]">
          <label className="grid gap-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Paste JSON</span>
            <textarea value={rawInput} onChange={(event) => setRawInput(event.target.value)} className="min-h-72 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 font-mono text-sm outline-none" placeholder="Paste exported Peak 38 config JSON here" />
          </label>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Upload file</span>
              <input type="file" accept="application/json" onChange={handleFile} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Mode</span>
              <select value={mode} onChange={(event) => setMode(event.target.value as ImportMode)} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-white outline-none">
                {Object.entries(modeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={handleParse} className="btn-secondary">Parse & preview</button>
            <button type="button" onClick={handleApply} disabled={!parsedConfig || working} className="btn-primary disabled:opacity-60">Confirm import</button>
            {previewError ? <p className="text-sm text-[var(--color-accent-red)]">{previewError}</p> : null}
            {message ? <p className="text-sm text-[var(--color-text-secondary)]">{message}</p> : null}
          </div>
        </div>

        {parsedConfig ? (
          <div className="grid gap-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Preview</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">{modeLabels[mode]}</h2>
            </div>
            {mode === "goal_update" ? (
              <div className="space-y-3">
                {diff.map((item) => (
                  <div key={item.path} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm">
                    <p className="font-medium text-white">{item.path}</p>
                    <p className="mt-1 text-[var(--color-text-secondary)]">{item.before || "∅"} → {item.after || "∅"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="overflow-auto rounded-2xl border border-white/8 bg-[#0d0d14] p-4 text-xs text-[var(--color-text-secondary)]">{JSON.stringify(parsedConfig, null, 2)}</pre>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
