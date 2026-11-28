"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Four destinations, each with a one-line promise so visitors know where they will land. */
export const NAV = [
  { href: "/", label: "Explore", hint: "Spin the living globe", block: "bg-orange text-ink", match: (p: string) => p === "/" },
  {
    href: "/explore",
    label: "Countries",
    hint: "Every collection, as a list",
    block: "bg-plum text-bone",
    match: (p: string) => p.startsWith("/explore") || p.startsWith("/country"),
  },
  {
    href: "/passports",
    label: "Stories",
    hint: "Passports, trails and routes",
    block: "bg-umber text-bone",
    match: (p: string) => p.startsWith("/passport") || p.startsWith("/trails") || p.startsWith("/routes") || p.startsWith("/p/"),
  },
  { href: "/method", label: "About", hint: "How we research and credit", block: "bg-brick text-bone", match: (p: string) => p.startsWith("/method") },
];

export function Header() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);
  const overlay = pathname === "/";
  const admin = pathname.startsWith("/admin");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        router.push("/search");
      } else if (e.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={`no-print z-50 w-full ${overlay ? "absolute inset-x-0 top-0" : "sticky top-0 border-b-2 border-ink bg-cream"}`}
    >
      <div className="mx-auto grid h-14 max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-2 justify-self-start" aria-label="Culture Passport — back to the globe">
          <span className="flex flex-col leading-none">
            <span className="font-display whitespace-nowrap text-[1rem] sm:text-[1.15rem]">Culture Passport</span>
            <span className="label-sm mt-0.5 hidden whitespace-nowrap text-ink-mute min-[400px]:block">{admin ? "Editorial desk" : "When culture travels"}</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center lg:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.hint}
                className={`relative px-4 py-2 font-ui text-[0.8rem] font-bold uppercase tracking-[0.12em] transition-colors ${active ? "text-brick" : "text-ink hover:text-brick"}`}
              >
                {item.label}
                {active && <span aria-hidden className="tab-down absolute left-1/2 top-full h-2 w-3 -translate-x-1/2 bg-brick" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href="/search"
            className="flex h-9 items-center gap-2 border-2 border-ink bg-bone px-3 font-ui text-[0.72rem] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-yellow"
            aria-label="Search traditions, places and sources"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 items-center gap-2 border-2 border-ink bg-ink px-3 font-ui text-[0.72rem] font-bold uppercase tracking-[0.1em] text-bone lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span aria-hidden className="flex w-4 flex-col gap-[3px]">
              <span className={`h-0.5 bg-bone transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`h-0.5 bg-bone transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`h-0.5 bg-bone transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div id="mobile-nav" hidden={!open} className="fixed inset-x-0 top-14 bottom-0 z-50 overflow-y-auto border-t-2 border-ink bg-cream lg:hidden">
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV.map((item, i) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-end justify-between gap-4 border-b-2 border-ink px-5 py-5 sm:px-6 ${item.block}`}
                aria-current={active ? "page" : undefined}
              >
                <span>
                  <span className="label-sm block opacity-80">
                    {String(i + 1).padStart(2, "0")} {active ? "· You are here" : ""}
                  </span>
                  <span className="font-display mt-1 block text-[2.56rem]">{item.label}</span>
                  <span className="mt-1 block text-sm font-medium opacity-90">{item.hint}</span>
                </span>
                <span aria-hidden className="font-display text-3xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            );
          })}
          <Link href="/search" className="flex items-center justify-between border-b-2 border-ink bg-bone px-5 py-5 sm:px-6">
            <span className="font-display text-2xl">Search the archive</span>
            <span className="label text-ink-mute">Traditions · places · sources</span>
          </Link>
        </nav>
        <div className="strip-checker" />
      </div>
    </header>
  );
}
