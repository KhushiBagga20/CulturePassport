/**
 * Loading symbol: a ring of dancing figures drawn in the style of Warli painting
 * (white figures of two triangles, a round head and line limbs on red earth, joined hand in hand
 * as in a circle dance). Original drawing for this site; the ring turns slowly and stops under
 * prefers-reduced-motion.
 */
const N = 10;
const R = 33;

function Figure({ i }: { i: number }) {
  const a = (i / N) * 360;
  // Alternate arm poses so the ring reads as a dance.
  const up = i % 2 === 0;
  return (
    <g transform={`rotate(${a} 50 50) translate(50 ${50 - R})`}>
      <circle cx="0" cy="-12.5" r="2.6" />
      <path d="M-4.6 -9 L4.6 -9 L0 -2.2 Z M0 -2.2 L-4.6 4.6 L4.6 4.6 Z" />
      <path
        d={up ? "M-4 -8.4 L-7.6 -12 M4 -8.4 L7.6 -12" : "M-4 -8.4 L-7.8 -4.6 M4 -8.4 L7.8 -4.6"}
        fill="none"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M-2.6 4.6 L-4.4 11 M2.6 4.6 L4.4 11" fill="none" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

export function WarliLoader({ label = "Loading", className = "" }: { label?: string; className?: string }) {
  return (
    <div role="status" className={`flex flex-col items-center gap-3 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-28 w-28" aria-hidden>
        <circle cx="50" cy="50" r="49" fill="#9A3B22" />
        <g className="animate-spin-slow" style={{ transformBox: "view-box", transformOrigin: "50px 50px", animationDuration: "14s" }} fill="#F6F0E3" stroke="#F6F0E3">
          {Array.from({ length: N }, (_, i) => (
            <Figure key={i} i={i} />
          ))}
        </g>
        <circle cx="50" cy="50" r="6" fill="none" stroke="#F6F0E3" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="2.2" fill="#F6F0E3" />
      </svg>
      <span className="label text-ink-mute">{label}</span>
      <span className="sr-only">Figures drawn in the style of Warli painting from Maharashtra.</span>
    </div>
  );
}
