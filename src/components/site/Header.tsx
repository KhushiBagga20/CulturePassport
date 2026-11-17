"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SealMark } from "./Seal";

const NAV = [
  { href: "/", label: "Atlas", match: (p: string) => p === "/" },
  { href: "/country/india", label: "India", match: (p: string) => p.startsWith("/country") },
  { href: "/passports", label: "Passports", match: (p: string) => p.startsWith("/passport") },
  { href: "/routes", label: "Roots & Routes", match: (p: string) => p.startsWith("/routes") },
  { href: "/trails", label: "Trails", match: (p: string) => p.startsWith("/trails") },
  { href: "/method", label: "Method", match: (p: string) => p.startsWith("/method") },
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
      className={`no-print z-50 w-full ${overlay ? "absolute inset-x-0 top-0" : "sticky top-0 border-b rule bg-ivory/92 backdrop-blur-sm"}`}
    >
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Culture Passport — back to the globe">
          <SealMark className="h-8 w-8 text-burgundy transition-transform duration-700 group-hover:rotate-[30deg]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.15rem] tracking-tight">Culture Passport</span>
            <span className="label-sm text-ink-mute">{admin ? "Editorial desk" : "When culture travels"}</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`label relative px-3 py-2 transition-colors hover:text-terracotta ${active ? "text-terracotta" : "text-ink-soft"}`}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-terracotta" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="label flex items-center gap-2 rounded-full border rule px-3 py-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
            aria-label="Search the archive"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border rule px-1 text-[0.6rem] text-ink-mute md:inline">⌘K</kbd>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="label flex h-9 items-center gap-2 rounded-full border rule px-3 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span aria-hidden className="flex w-4 flex-col gap-[3px]">
              <span className={`h-px bg-ink transition-transform ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`h-px bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`h-px bg-ink transition-transform ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </span>
            Menu
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 top-14 bottom-0 z-50 overflow-y-auto bg-ivory px-4 pb-10 pt-6 sm:px-6 lg:hidden"
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-baseline justify-between border-b rule py-4"
              aria-current={item.match(pathname) ? "page" : undefined}
            >
              <span className="font-display text-4xl">{item.label}</span>
              <span className="label text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
            </Link>
          ))}
          <Link href="/explore" className="label mt-6 text-ink-soft underline">
            Browse every country as a list
          </Link>
        </nav>
        <div className="strip-diamond mt-10" />
      </div>
    </header>
  );
}
