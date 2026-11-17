import Link from "next/link";
import { RotatingSeal } from "@/components/site/Seal";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <RotatingSeal id="nf" text="NOT IN THE ARCHIVE · STORIES BEING DOCUMENTED · " center="?" className="h-36 w-36 text-terracotta" />
      <h1 className="font-display mt-8 text-[clamp(3rem,9vw,6rem)]">Not in the archive</h1>
      <p className="mt-4 max-w-md text-ink-soft">
        This page doesn&rsquo;t exist — or its story hasn&rsquo;t been documented yet. If you scanned a printed code, the passport may still be in editorial
        review.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-ink">
          Back to the globe
        </Link>
        <Link href="/passports" className="btn btn-cream">
          Passport register
        </Link>
        <Link href="/search" className="btn btn-cream">
          Search
        </Link>
      </div>
    </section>
  );
}
