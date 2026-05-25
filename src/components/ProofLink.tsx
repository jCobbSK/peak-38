import Link from "next/link";

type ProofLinkProps = {
  url?: string;
  label?: string;
};

function StravaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
      <path d="M14.18 2 9.95 10.36h2.5l1.73-3.4 1.73 3.4h2.5L14.18 2Zm-4.5 10.16-3.95 7.82h2.32l1.63-3.2 1.63 3.2h2.32l-3.95-7.82Z" />
    </svg>
  );
}

export default function ProofLink({ url, label = "Proof" }: ProofLinkProps) {
  if (!url) {
    return <span className="text-xs text-[var(--color-text-muted)]">No proof</span>;
  }

  const isStrava = url.toLowerCase().includes("strava");

  return (
    <Link
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent-blue)]/40 hover:text-[var(--color-text-primary)]"
    >
      {isStrava ? <StravaIcon /> : <span aria-hidden="true">↗</span>}
      <span>{label}</span>
    </Link>
  );
}
