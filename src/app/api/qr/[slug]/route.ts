import { NextResponse } from "next/server";
import { findTradition, getArchive, isPublic } from "@/lib/data/archive";
import { passportPath, requestOrigin } from "@/lib/site";
import { qrPng, qrSvg } from "@/lib/qr";

/**
 * GET /api/qr/:slug?format=svg|png&size=1024&download=1
 * Encodes the passport's permanent public URL. Unpublished passports have no public QR.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/qr/[slug]">) {
  const { slug } = await ctx.params;
  const archive = await getArchive();
  const found = findTradition(archive, slug);
  if (!found || !isPublic(found.tradition)) {
    return NextResponse.json({ error: "No published passport with that slug" }, { status: 404 });
  }
  const t = found.tradition;
  const url = `${await requestOrigin()}${passportPath(t.slug)}`;
  const params = new URL(request.url).searchParams;
  const format = params.get("format") === "png" ? "png" : "svg";
  const download = params.has("download");
  const filename = `culture-passport-${t.passportNo}-${t.slug}-qr.${format}`;
  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=3600",
    "X-Passport-Url": url,
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="${filename}"`;

  if (format === "png") {
    const size = Number(params.get("size") ?? 1024) || 1024;
    const png = await qrPng(url, size);
    return new NextResponse(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = await qrSvg(url);
  return new NextResponse(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" } });
}
