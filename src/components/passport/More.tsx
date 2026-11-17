import type { ReactNode } from "react";

/**
 * Progressive disclosure built on <details>, so it works without JavaScript,
 * is keyboard-accessible, and prints expanded.
 */
export function More({
  label,
  detail,
  children,
  tone = "light",
  open = false,
  className = "",
}: {
  label: string;
  detail?: string;
  children: ReactNode;
  tone?: "light" | "dark";
  open?: boolean;
  className?: string;
}) {
  return (
    <details className={`more group ${className}`} open={open}>
      <summary
        className={`inline-flex items-center gap-3 border-2 px-4 py-2.5 transition-colors ${tone === "dark" ? "border-bone/60 hover:bg-bone hover:text-ink" : "border-ink bg-bone hover:bg-yellow"}`}
      >
        <span aria-hidden className="more-icon font-display text-2xl leading-none transition-transform">
          +
        </span>
        <span className="font-ui text-[0.74rem] font-bold uppercase tracking-[0.1em]">
          <span className="more-closed">{label}</span>
          <span className="more-open">Show less</span>
        </span>
        {detail && <span className={`more-closed text-xs ${tone === "dark" ? "opacity-70" : "text-ink-mute"}`}>{detail}</span>}
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}
