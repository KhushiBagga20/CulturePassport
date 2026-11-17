import Link from "next/link";
import { DiamondBadge } from "./Seal";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Explore",
    links: [
      ["The living globe", "/"],
      ["Countries", "/explore"],
      ["Search", "/search"],
    ],
  },
  {
    title: "Stories",
    links: [
      ["All passports", "/passports"],
      ["Cultural trails", "/trails"],
      ["Roots & Routes map", "/routes"],
    ],
  },
  {
    title: "About",
    links: [
      ["How we work", "/method"],
      ["Evidence labels", "/method#evidence"],
      ["Corrections", "/method#corrections"],
      ["Image credits", "/method#credits"],
      ["Editors", "/admin"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="no-print mt-auto bg-ink text-bone">
      <div className="strip-checker" />
      <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <p className="label text-yellow">Our purpose</p>
          <p className="font-display mt-4 text-[clamp(2.03rem,3.9vw,3.19rem)]">
            Culture becomes a bridge — <span className="text-vermilion">not a boundary.</span>
          </p>
          <p className="mt-5 max-w-md text-bone/75">
            We document where traditions come from, who carries them, and how they travel — so the story can travel with them.
          </p>
        </div>
        <div className="flex items-start justify-center lg:col-span-2">
          <DiamondBadge top="CULTURE PASSPORT" center="↗" bottom="INDIA · UAE · WORLD" className="h-auto w-48 text-yellow" />
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="label text-bone/50">{c.title}</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link className="hover:text-yellow" href={href}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-bone/15">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-6 text-xs leading-relaxed text-bone/65 sm:px-6 md:grid-cols-3 lg:px-10">
          <p>Culture Passport is an education, documentation and attribution project — not a legal ownership registry.</p>
          <p>Passport numbers are archive references, not certificates.</p>
          <p>Map boundaries come from Natural Earth and imply no position on disputed territories.</p>
        </div>
      </div>
    </footer>
  );
}
