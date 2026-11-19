/** The archive's mark: a compass rose inside a passport seal. */
export function SealMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 2.2" />
      <ellipse cx="24" cy="24" rx="7" ry="13" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M11 24h26M24 11v26" stroke="currentColor" strokeWidth="1.1" />
      <path d="M24 17l3 7-3 7-3-7z" fill="#F4BA2E" stroke="currentColor" strokeWidth="0.8" />
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
  shape,
}: {
  id: string;
  text: string;
  center: string;
  className?: string;
  color?: string;
  spin?: boolean;
  /** a country silhouette (countryShape) shown in the centre instead of the `center` text */
  shape?: { primary: string[]; shared: string[] };
}) {
  const pathId = `seal-path-${id}`;
  // The ring text is stretched to exactly one lap of the circle, so its ends never overlap,
  // and the ring spins around the seal's fixed centre (100, 100) rather than the text's own
  // bounding box, which shifts while the web font loads and made the text drift off the seal.
  const LAP = 2 * Math.PI * 74;
  const fontSize = Math.min(12, LAP / (text.length * 0.7));
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={shape ? `${center} — country seal` : `${center} seal`}>
      <defs>
        <path id={pathId} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <g className={spin ? "animate-spin-slow" : ""} style={{ transformBox: "view-box", transformOrigin: "100px 100px" }}>
        <text fill={color} style={{ fontFamily: "var(--font-ui)", fontSize: Number(fontSize.toFixed(2)), fontWeight: 600 }}>
          <textPath href={`#${pathId}`} textLength={Math.floor(LAP) - 2} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="94" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="58" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="100" cy="100" r="52" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="2 3" />
      {shape ? (
        <g transform="translate(68 68) scale(0.64)" color={color === "currentColor" ? undefined : color}>
          <defs>
            <pattern id={`seal-hatch-${id}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="3" stroke="currentColor" strokeWidth="1.2" />
            </pattern>
          </defs>
          {shape.shared.map((d, i) => (
            <path key={`s${i}`} d={d} fill={`url(#seal-hatch-${id})`} stroke="currentColor" strokeWidth="0.8" />
          ))}
          {shape.primary.map((d, i) => (
            <path key={`p${i}`} d={d} fill="currentColor" stroke="currentColor" strokeWidth="0.6" />
          ))}
        </g>
      ) : (
        <>
        <text
          x="100"
          y="96"
          textAnchor="middle"
          fill={color}
          style={{ fontFamily: "var(--font-ui)", fontSize: 10, letterSpacing: "0.22em" }}
        >
          NO.
        </text>
        <text
          x="100"
          y="126"
          textAnchor="middle"
          fill={color}
          style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          {center}
        </text>
        </>
      )}
    </svg>
  );
}

/**
 * A passport's country silhouette. The country it is filed under is solid; other countries the
 * tradition belongs to are hatched, so a shared tradition is never shown as one country's alone.
 * `shape` comes from countryShape() on the server (a 100×100 box).
 */
export function CountryMark({
  shape,
  id,
  className = "",
  title,
}: {
  shape: { primary: string[]; shared: string[] };
  id: string;
  className?: string;
  title?: string;
}) {
  const hatch = `cm-hatch-${id}`;
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <pattern id={hatch} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="3" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
      </defs>
      {shape.shared.map((d, i) => (
        <path key={`s${i}`} d={d} fill={`url(#${hatch})`} stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
      ))}
      {shape.primary.map((d, i) => (
        <path key={`p${i}`} d={d} fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
