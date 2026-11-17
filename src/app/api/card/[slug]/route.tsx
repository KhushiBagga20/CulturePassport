import { NextResponse } from "next/server";
import { findTradition, getArchive, isPublic } from "@/lib/data/archive";
import { passportPath, requestOrigin } from "@/lib/site";
import { renderCard } from "@/lib/card-image";

/** GET /api/card/:slug[?layout=landscape][&download=1] — the shareable identity card as PNG. */
export async function GET(request: Request, ctx: RouteContext<"/api/card/[slug]">) {
  const { slug } = await ctx.params;
  const archive = await getArchive();
  const found = findTradition(archive, slug);
  if (!found || !isPublic(found.tradition)) return NextResponse.json({ error: "No published passport with that slug" }, { status: 404 });
  const t = found.tradition;
  const params = new URL(request.url).searchParams;
  const layout = params.get("layout") === "landscape" ? "landscape" : "portrait";
  const url = `${await requestOrigin()}${passportPath(t.slug)}`;
  const headers: Record<string, string> = { "Cache-Control": "public, max-age=3600" };
  if (params.has("download")) headers["Content-Disposition"] = `attachment; filename="culture-passport-${t.passportNo}-${t.slug}.png"`;
  return renderCard(t, archive, url, layout, headers);
}
