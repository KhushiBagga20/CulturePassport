import { NextResponse } from "next/server";
import { getArchive, isPublic } from "@/lib/data/archive";

/**
 * Short, permanent links by passport number: /p/001 → /passport/kolhapuri-chappal.
 * Useful on small printed labels; the number never changes even if a slug does.
 */
export async function GET(request: Request, ctx: RouteContext<"/p/[no]">) {
  const { no } = await ctx.params;
  const n = no.replace(/\D/g, "").padStart(3, "0");
  const archive = await getArchive();
  const t = archive.traditions.find((x) => x.passportNo === n && isPublic(x));
  const target = new URL(t ? `/passport/${t.slug}` : `/passports?missing=${encodeURIComponent(no)}`, request.url);
  return NextResponse.redirect(target, t ? 308 : 307);
}
