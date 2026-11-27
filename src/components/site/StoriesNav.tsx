import Link from "next/link";

const TABS = [
  { key: "passports", href: "/passports", label: "Passports", hint: "Every tradition, by number" },
  { key: "trails", href: "/trails", label: "Trails", hint: "Themed journeys" },
  { key: "routes", href: "/routes", label: "Roots & Routes", hint: "The connection map" },
] as const;

/** Section tabs for everything under "Stories", so visitors always see where they are and what else is here. */
export function StoriesNav({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Stories" className="border-b-2 border-ink bg-green text-bone">
      {/* Three equal tabs on phones (nothing cut off); with descriptions from tablet width up. */}
      <div className="mx-auto grid max-w-[1500px] grid-cols-3 items-stretch sm:flex sm:px-6 lg:px-10">
        <span className="label hidden shrink-0 items-center border-r border-bone/30 pr-4 text-yellow sm:flex">Stories</span>
        {TABS.map((t) => {
          const on = t.key === current;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`flex min-w-0 flex-col justify-center px-2 py-3 text-center transition-colors sm:shrink-0 sm:px-4 sm:text-left ${on ? "bg-cream text-ink" : "hover:bg-bone/10"}`}
            >
              <span className="font-ui text-[0.78rem] font-bold uppercase tracking-[0.1em]">{t.label}</span>
              <span className={`hidden text-xs sm:block ${on ? "text-ink-mute" : "text-bone/70"}`}>{t.hint}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
