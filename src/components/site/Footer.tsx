import Link from "next/link";
import { SealMark } from "./Seal";

export function Footer() {
  return (
    <footer className="no-print mt-auto bg-ink text-ivory">
      <div className="strip-diamond" />
      <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-6">
          <p className="label text-mustard">Our purpose</p>
          <p className="font-serif mt-4 text-4xl leading-[1.05] sm:text-5xl balance">
            Culture becomes a bridge — <em className="text-mustard">not a boundary.</em>
          </p>
          <p className="mt-6 max-w-md text-ivory/70">
            Culture without borders, but rooted in identity. We document where traditions come from, who carries them, and how they travel — so the
            story can travel with them.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6">
          <div>
            <p className="label text-ivory/50">Explore</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-mustard" href="/">The living globe</Link></li>
              <li><Link className="hover:text-mustard" href="/explore">Country index</Link></li>
              <li><Link className="hover:text-mustard" href="/passports">Passport register</Link></li>
              <li><Link className="hover:text-mustard" href="/routes">Roots &amp; Routes</Link></li>
              <li><Link className="hover:text-mustard" href="/trails">Cultural trails</Link></li>
              <li><Link className="hover:text-mustard" href="/search">Search</Link></li>
            </ul>
          </div>
          <div>
            <p className="label text-ivory/50">Trust</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-mustard" href="/method">Editorial method</Link></li>
              <li><Link className="hover:text-mustard" href="/method#evidence">Evidence labels</Link></li>
              <li><Link className="hover:text-mustard" href="/method#corrections">Corrections</Link></li>
              <li><Link className="hover:text-mustard" href="/method#credits">Image credits</Link></li>
              <li><Link className="hover:text-mustard" href="/admin">Editors</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="label text-ivory/50">Please note</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ivory/70">
              <li>Culture Passport is an education, documentation and attribution project — not a legal ownership registry.</li>
              <li>Passport numbers are archive references, not certificates.</li>
              <li>Map boundaries come from Natural Earth and imply no position on disputed territories.</li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-10">
          <span className="flex items-center gap-3">
            <SealMark className="h-7 w-7 text-ivory/80" />
            <span className="label text-ivory/60">When culture travels, let its story travel with it.</span>
          </span>
          <span className="label-sm text-ivory/40">India → UAE → World</span>
        </div>
      </div>
    </footer>
  );
}
