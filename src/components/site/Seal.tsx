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
