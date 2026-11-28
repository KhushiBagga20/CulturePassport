import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/lib/data/local-store";
import { db } from "@/lib/db";
import { storeMode } from "@/lib/data/store-mode";
import { readFile, UPLOADS_PATH } from "@/lib/data/github-store";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

/** Serves images uploaded through the editorial desk: from GitHub (backend/data/editor/uploads), the database, or .data/uploads. */
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[file]">) {
  const { file } = await ctx.params;
  const m = file.match(/^(upload-[a-f0-9]{8})\.(jpg|png|webp|avif)$/);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    let data: Uint8Array;
    const mode = storeMode();
    if (mode === "postgres") {
      const [row] = await db()`select bytes from media_files where id = ${file}`;
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      data = row.bytes as Uint8Array;
    } else if (mode === "github") {
      const bytes = await readFile(`${UPLOADS_PATH}/${file}`);
      if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });
      data = bytes;
    } else {
      data = await fs.readFile(path.join(UPLOAD_DIR, file));
    }
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": TYPES[m[2]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
