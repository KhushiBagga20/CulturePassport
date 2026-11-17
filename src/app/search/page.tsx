import type { Metadata } from "next";
import { Suspense } from "react";
import { getArchive } from "@/lib/data/archive";
import { buildSearchIndex } from "@/lib/search-index";
import { SearchClient } from "@/components/search/SearchClient";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Search the archive",
  description: "Search traditions, places, communities, alternate names, periods, attribution cases, claims and sources.",
};

export default async function SearchPage() {
  const archive = await getArchive();
  const docs = buildSearchIndex(archive);
  const countries = archive.countries.map((c) => ({ iso2: c.iso2, name: c.name }));
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:py-20">
      <p className="label text-terracotta">Search · {docs.length} entries</p>
      <Suspense fallback={<div className="h-24" />}>
        <SearchClient docs={docs} countries={countries} />
      </Suspense>
    </div>
  );
}
