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
      <div className="no-scrollbar mx-auto flex max-w-[1500px] items-stretch overflow-x-auto px-4 sm:px-6 lg:px-10">
        <span className="label hidden shrink-0 items-center border-r border-bone/30 pr-4 text-yellow sm:flex">Stories</span>
        {TABS.map((t) => {
          const on = t.key === current;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`flex shrink-0 flex-col justify-center px-4 py-3 transition-colors ${on ? "bg-cream text-ink" : "hover:bg-bone/10"}`}
            >
              <span className="font-ui text-[0.78rem] font-bold uppercase tracking-[0.1em]">{t.label}</span>
              <span className={`text-xs ${on ? "text-ink-mute" : "text-bone/70"}`}>{t.hint}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
