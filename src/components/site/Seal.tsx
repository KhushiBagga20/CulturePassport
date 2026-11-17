/** The archive's mark: a compass rose inside a passport seal. */
export function SealMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 2.2" />
      <ellipse cx="24" cy="24" rx="7" ry="13" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M11 24h26M24 11v26" stroke="currentColor" strokeWidth="1.1" />
      <path d="M24 17l3 7-3 7-3-7z" fill="#E4AA29" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

/**
 * A rotating passport seal with circular text. `id` must be unique on the page.
 * Rotation is decorative and stops under prefers-reduced-motion.
 */
export function RotatingSeal({
  id,
  text,
  center,
  className = "",
  color = "currentColor",
  spin = true,
}: {
  id: string;
  text: string;
  center: string;
  className?: string;
  color?: string;
  spin?: boolean;
}) {
  const pathId = `seal-path-${id}`;
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${center} seal`}>
      <g className={spin ? "origin-center animate-spin-slow [transform-box:fill-box]" : ""}>
        <defs>
          <path id={pathId} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text fill={color} style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, letterSpacing: "0.32em", fontWeight: 500 }}>
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="94" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="58" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="100" cy="100" r="52" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="2 3" />
      <text
        x="100"
        y="96"
        textAnchor="middle"
        fill={color}
        style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.22em" }}
      >
        NO.
      </text>
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fill={color}
        style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, fontVariationSettings: '"wdth" 75' }}
      >
        {center}
      </text>
    </svg>
  );
}
