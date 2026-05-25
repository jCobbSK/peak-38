"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Invalid password");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,143,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.15),transparent_22%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.96),rgba(10,10,15,0.96))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-text-muted)]">Peak 38</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-white">Enter the summit room.</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">One password. One mission board. Dark mode only.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0 transition focus:border-[var(--color-accent-blue)]/40"
              placeholder="••••••••"
              autoFocus
              required
            />
          </label>
          {error ? <p className="text-sm text-[var(--color-accent-red)]">{error}</p> : null}
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Unlocking…" : "Enter Peak 38"}
          </button>
        </form>
      </div>
    </main>
  );
}
