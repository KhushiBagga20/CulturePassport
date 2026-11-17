/**
 * A scrolling marquee band. Decorative: everything it says is also on the page,
 * so the whole band is hidden from assistive technology. Stops under reduced motion.
 */
export function Ticker({
  items,
  className = "",
  speed = 45,
  dot = "●",
  dotClassName = "",
}: {
  items: string[];
  className?: string;
  speed?: number;
  dot?: string;
  dotClassName?: string;
}) {
  // Repeat short lists so each half of the loop is wider than the viewport.
  const reps = Math.max(1, Math.ceil(12 / Math.max(1, items.length)));
  const run = Array.from({ length: reps }, () => items).flat();
  const half = (key: string) => (
    <span key={key} className="flex shrink-0 items-center">
      {run.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-5">{t}</span>
          <span className={dotClassName}>{dot}</span>
        </span>
      ))}
    </span>
  );
  return (
    <div aria-hidden className={`ticker ${className}`}>
      <div className="ticker-track" style={{ ["--ticker-speed" as string]: `${speed}s` }}>
        {half("a")}
        {half("b")}
      </div>
    </div>
  );
}
