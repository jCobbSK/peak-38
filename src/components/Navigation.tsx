"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/checkpoints", label: "Checkpoints", icon: "checkpoint" },
  { href: "/pillars/physical", label: "Physical", icon: "physical" },
  { href: "/pillars/mind", label: "Mind", icon: "mind" },
  { href: "/pillars/personal", label: "Personal", icon: "personal" },
  { href: "/pillars/recovery", label: "Recovery", icon: "recovery" },
  { href: "/data", label: "Import/Export", icon: "data" },
] as const;

function Icon({ name, active }: { name: (typeof navItems)[number]["icon"]; active: boolean }) {
  const className = `h-5 w-5 ${active ? "text-white" : "text-[var(--color-text-secondary)]"}`;

  switch (name) {
    case "home":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 11 9-7 9 7" /><path d="M5 10.5V20h14v-9.5" /><path d="M9 20v-6h6v6" /></svg>;
    case "checkpoint":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 4v16" /><path d="M6 5h10l-2.5 4L16 13H6" /></svg>;
    case "physical":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9h3l2 6h8l2-6h3" /><path d="M7 9V6" /><path d="M17 9V6" /></svg>;
    case "mind":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9.5 18H8a4 4 0 0 1 0-8 5 5 0 0 1 9.7-1.6A3.5 3.5 0 1 1 18 18h-1.5" /><path d="M12 11v7" /><path d="M9.5 15.5 12 18l2.5-2.5" /></svg>;
    case "personal":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 20h14" /><path d="M7 17V6l5 3 5-3v11" /></svg>;
    case "recovery":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-6-4.35-9-8.5C.3 8.85 2.6 4 7 4c2.16 0 3.4 1.04 5 3 1.6-1.96 2.84-3 5-3 4.4 0 6.7 4.85 4 8.5-3 4.15-9 8.5-9 8.5Z" /></svg>;
    case "data":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
  }
}

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-white/6 bg-[linear-gradient(180deg,rgba(10,10,15,0.96),rgba(18,18,26,0.9))] px-6 py-8 md:flex md:flex-col">
        <div className="mb-10">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Peak 38</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none text-white">Mountain-grade focus.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">A night-mode control room for the 26-month Ironman build.</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                  active
                    ? "border-[var(--color-accent-blue)]/40 bg-[linear-gradient(135deg,rgba(79,143,255,0.18),rgba(139,92,246,0.16))] text-white shadow-[0_20px_40px_rgba(79,143,255,0.12)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:border-white/10 hover:bg-white/4 hover:text-white"
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-white/10" : "bg-white/4 group-hover:bg-white/6"}`}>
                  <Icon name={item.icon} active={active} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-[var(--color-text-muted)]">{item.href === "/" ? "Mission overview" : item.href.replaceAll("/", " · ").replace(/^ · /, "")}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,26,0.96),rgba(10,10,15,0.96))] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition ${
                  active ? "bg-white/10 text-white" : "text-[var(--color-text-secondary)]"
                } ${item.href === "/data" ? "col-span-2" : "col-span-1"}`}
              >
                <Icon name={item.icon} active={active} />
                <span className="truncate text-[11px] font-semibold leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
