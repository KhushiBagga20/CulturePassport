import type { MotifKey } from "@/lib/types";

/**
 * Archive illustrations: original geometric studies drawn for Culture Passport.
 * They are wayfinding marks, not reproductions of traditional artworks, and are
 * never used as documentary evidence.
 */
export function Motif({ motif, className, title, size }: { motif: MotifKey; className?: string; title?: string; size?: number }) {
  const label = title ?? `Archive illustration for ${motif} (not a traditional artwork)`;
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      {DRAW[motif]}
    </svg>
  );
}

const INK = "#211C19";
const IVORY = "#F6F0E3";

const DRAW: Record<MotifKey, React.ReactNode> = {
  kolhapuri: (
    <g>
      <rect width="200" height="200" fill="#EBC8B6" />
      <g transform="translate(100 102)">
        {/* sole */}
        <path
          d="M0,-84 C26,-84 38,-60 38,-30 C38,0 30,22 32,46 C34,70 22,86 0,86 C-22,86 -34,70 -32,46 C-30,22 -38,0 -38,-30 C-38,-60 -26,-84 0,-84Z"
          fill="#B84B30"
          stroke={INK}
          strokeWidth="2"
        />
        <path
          d="M0,-76 C20,-76 30,-56 30,-30 C30,-2 23,22 25,44 C27,64 18,78 0,78 C-18,78 -27,64 -25,44 C-23,22 -30,-2 -30,-30 C-30,-56 -20,-76 0,-76Z"
          fill="none"
          stroke={IVORY}
          strokeWidth="1.4"
          strokeDasharray="1.5 4"
        />
        {/* toe loop and T-strap */}
        <circle cx="-8" cy="-58" r="7" fill="none" stroke={INK} strokeWidth="3.2" />
        <path d="M-8,-51 L-8,-26" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        {/* braided band */}
        <path d="M-38,-22 Q0,-34 38,-22 L38,-2 Q0,-14 -38,-2Z" fill="#E4AA29" stroke={INK} strokeWidth="2" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M${-32 + i * 9},-20 l4.5,7 l4.5,-7`} fill="none" stroke={INK} strokeWidth="1.4" transform={`translate(0 ${(Math.abs(i - 3.5) * 0.9).toFixed(2)})`} />
        ))}
        {/* heel stitching */}
        <path d="M-20,62 Q0,72 20,62" fill="none" stroke={INK} strokeWidth="1.4" strokeDasharray="3 3" />
      </g>
    </g>
  ),
  madhubani: (
    <g>
      <rect width="200" height="200" fill="#F2DCA5" />
      <rect x="8" y="8" width="184" height="184" fill="none" stroke="#581D30" strokeWidth="3" />
      <rect x="15" y="15" width="170" height="170" fill="none" stroke="#581D30" strokeWidth="1.2" />
      {Array.from({ length: 17 }).map((_, i) => (
        <path key={i} d={`M${15 + i * 10},15 l5,8 l5,-8`} fill="#B84B30" />
      ))}
      {[0, 180].map((rot) => (
        <g key={rot} transform={`rotate(${rot} 100 108)`}>
          <path d="M44,96 C70,64 120,64 140,92 L160,74 L156,104 L160,130 L140,112 C118,138 70,134 44,96Z" fill="#B84B30" stroke="#581D30" strokeWidth="2.5" />
          <path d="M52,96 C74,72 116,72 134,95 C116,124 74,122 52,96Z" fill="none" stroke={IVORY} strokeWidth="1.3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={i} d={`M${72 + i * 9},84 q4,12 0,24`} fill="none" stroke="#581D30" strokeWidth="1.2" />
          ))}
          <circle cx="60" cy="94" r="4.5" fill={IVORY} stroke="#581D30" strokeWidth="1.5" />
          <circle cx="60" cy="94" r="1.6" fill="#581D30" />
        </g>
      ))}
    </g>
  ),
  phulkari: (
    <g>
      <rect width="200" height="200" fill="#8E2F22" />
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 4 }).map((__, c) => {
          const cx = 25 + c * 50;
          const cy = 25 + r * 50;
          return (
            <g key={`${r}-${c}`}>
              <path d={`M${cx},${cy - 22} L${cx + 22},${cy} L${cx},${cy + 22} L${cx - 22},${cy}Z`} fill="#E4AA29" />
              {Array.from({ length: 9 }).map((_, k) => (
                <path key={k} d={`M${cx - 20 + k * 5},${cy - 18 + Math.abs(k - 4) * 4.5} v${36 - Math.abs(k - 4) * 9}`} stroke="#F2C35B" strokeWidth="1.1" />
              ))}
              <path d={`M${cx},${cy - 8} L${cx + 8},${cy} L${cx},${cy + 8} L${cx - 8},${cy}Z`} fill={IVORY} />
            </g>
          );
        }),
      )}
    </g>
  ),
  warli: (
    <g>
      <rect width="200" height="200" fill="#7A3B22" />
      <circle cx="100" cy="100" r="78" fill="none" stroke={IVORY} strokeWidth="0.8" strokeDasharray="1 4" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x = (100 + Math.cos(a) * 62).toFixed(2);
        const y = (100 + Math.sin(a) * 62).toFixed(2);
        const deg = ((a * 180) / Math.PI + 90).toFixed(1);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${deg})`} fill={IVORY} stroke={IVORY}>
            <circle cx="0" cy="-15" r="4" />
            <path d="M-7,-10 L7,-10 L0,0Z" />
            <path d="M0,0 L-7,10 L7,10Z" />
            <path d="M-7,-8 L-14,-2 M7,-8 L14,-2" strokeWidth="1.6" fill="none" />
            <path d="M-4,10 L-6,18 M4,10 L6,18" strokeWidth="1.6" fill="none" />
          </g>
        );
      })}
      <g transform="translate(100 104)" fill={IVORY} stroke={IVORY}>
        <circle cx="0" cy="-20" r="5" />
        <path d="M-9,-14 L9,-14 L0,-1Z" />
        <path d="M0,-1 L-9,12 L9,12Z" />
        <path d="M6,-12 L26,-26" strokeWidth="3" />
      </g>
    </g>
  ),
  ajrakh: (
    <g>
      <rect width="200" height="200" fill="#4e2b4c" />
      {Array.from({ length: 3 }).map((_, r) =>
        Array.from({ length: 3 }).map((__, c) => {
          const cx = 34 + c * 66;
          const cy = 34 + r * 66;
          return (
            <g key={`${r}-${c}`} transform={`translate(${cx} ${cy})`}>
              <rect x="-33" y="-33" width="66" height="66" fill="none" stroke="#9E2A22" strokeWidth="3" />
              <rect x="-20" y="-20" width="40" height="40" fill="#9E2A22" />
              <rect x="-20" y="-20" width="40" height="40" fill="#9E2A22" transform="rotate(45)" />
              <circle r="13" fill="#211C19" />
              <circle r="8" fill={IVORY} />
              <circle r="3" fill="#9E2A22" />
              {[0, 90, 180, 270].map((d) => (
                <circle key={d} cx="0" cy="-27" r="2.4" fill={IVORY} transform={`rotate(${d + 45})`} />
              ))}
            </g>
          );
        }),
      )}
    </g>
  ),
  sadu: (
    <g>
      <rect width="200" height="200" fill="#211C19" />
      {[0, 1, 2, 3].map((b) => {
        const y = 10 + b * 48;
        return (
          <g key={b} transform={`translate(0 ${y})`}>
            <rect y="0" width="200" height="6" fill={b % 2 ? "#A3352B" : IVORY} />
            <rect y="34" width="200" height="6" fill={b % 2 ? IVORY : "#A3352B"} />
            {Array.from({ length: 10 }).map((_, i) => (
              <path key={i} d={`M${i * 20},${b % 2 ? 30 : 10} l10,${b % 2 ? -20 : 20} l10,${b % 2 ? 20 : -20}`} fill={b % 2 ? "#E6D9BD" : "#A3352B"} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <path key={`d${i}`} d={`M${i * 20 + 10},14 l4,6 l-4,6 l-4,-6z`} fill={b % 2 ? "#211C19" : IVORY} />
            ))}
          </g>
        );
      })}
    </g>
  ),
  // Neutral archive mark: a globe of meridians and parallels with a compass point. Represents no tradition.
  atlas: (
    <g>
      <rect width="200" height="200" fill="#E1D4B5" />
      <g fill="none" stroke={INK} strokeWidth="2">
        <circle cx="100" cy="100" r="70" fill="#F6F0E3" />
        <ellipse cx="100" cy="100" rx="35" ry="70" />
        <ellipse cx="100" cy="100" rx="70" ry="24" />
        <path d="M100 30 V170 M30 100 H170" />
        <path d="M44 62 H156 M44 138 H156" strokeDasharray="3 4" />
      </g>
      <path d="M100 82 L108 100 L100 118 L92 100 Z" fill="#E04A2C" stroke={INK} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="76" fill="none" stroke={IVORY} strokeWidth="3" strokeDasharray="1 7" />
    </g>
  ),
};
