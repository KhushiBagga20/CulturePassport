/* eslint-disable @next/next/no-img-element -- next/og (satori) renders plain <img> elements */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Archive, Tradition } from "./types";
import { ACCENT, CATEGORY } from "./labels";
import { qrDataUrl } from "./qr";
import { Motif } from "@/components/motifs/Motif";

async function font(pkg: string, file: string) {
  return readFile(path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file));
}

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 600 | 700 | 800; style: "normal" | "italic" }[]> | null = null;
function fonts() {
  fontsPromise ??= Promise.all([
    font("inter", "inter-latin-800-normal.woff").then((data) => ({ name: "Display", data, weight: 800 as const, style: "normal" as const })),
    font("inter", "inter-latin-600-italic.woff").then((data) => ({ name: "Title", data, weight: 600 as const, style: "italic" as const })),
    font("inter", "inter-latin-500-normal.woff").then((data) => ({ name: "Body", data, weight: 500 as const, style: "normal" as const })),
    font("inter", "inter-latin-500-normal.woff").then((data) => ({ name: "UI", data, weight: 500 as const, style: "normal" as const })),
    font("inter", "inter-latin-700-normal.woff").then((data) => ({ name: "UI", data, weight: 700 as const, style: "normal" as const })),
  ]);
  return fontsPromise;
}

/** Checkerboard band, as on the site's colour blocks. */
const STRIP = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="18"><rect width="1200" height="18" fill="#F4BA2E"/>${Array.from({ length: 67 })
    .map((_, i) => `<rect x="${i * 18}" y="${i % 2 ? 9 : 0}" width="9" height="9" fill="#1B1616"/><rect x="${i * 18 + 9}" y="${i % 2 ? 0 : 9}" width="9" height="9" fill="#1B1616"/>`)
    .join("")}</svg>`,
).toString("base64")}`;

/** The shareable Culture Passport identity card, rendered to PNG. */
export async function renderCard(
  t: Tradition,
  archive: Archive,
  url: string,
  layout: "portrait" | "landscape",
  headers?: Record<string, string>,
) {
  const accent = ACCENT[t.accent];
  const communities = t.communities.map((c) => archive.communities.find((x) => x.id === c.community)?.name).filter(Boolean).join(" · ");
  const [qr, fontData] = await Promise.all([qrDataUrl(url, 420), fonts()]);
  const portrait = layout === "portrait";
  const W = portrait ? 1080 : 1200;
  const H = portrait ? 1350 : 630;
  const shortUrl = url.replace(/^https?:\/\//, "");
  const story = t.summary.length > 210 ? `${t.summary.slice(0, 207).replace(/\s\S*$/, "")}…` : t.summary;

  const label = { color: "#6B5F55", width: portrait ? 160 : 112, textTransform: "uppercase" as const, letterSpacing: 2, fontWeight: 700 };
  const element = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#ECE2CA", color: "#1B1616", fontFamily: "UI" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1B1616",
          color: "#F6F0E3",
          padding: portrait ? "18px 44px" : "12px 30px",
          fontSize: portrait ? 22 : 16,
          letterSpacing: 4,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        <span style={{ color: "#F4BA2E" }}>Culture Passport</span>
        <span>No. {t.passportNo}</span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          margin: portrait ? 40 : 26,
          border: "3px solid #1B1616",
          background: "#F6F0E3",
          padding: portrait ? 44 : 30,
          gap: 36,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Display",
              fontSize: portrait ? 92 : 60,
              lineHeight: 0.95,
              letterSpacing: -3,
              textTransform: "uppercase",
            }}
          >
            {t.name}
          </div>
          <div style={{ display: "flex", fontFamily: "Title", fontStyle: "italic", fontSize: portrait ? 38 : 27, color: accent.text, marginTop: 14 }}>{t.tagline}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: portrait ? 30 : 16, fontSize: portrait ? 21 : 15, gap: 8 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={label}>Region</span>
              <span style={{ flex: 1 }}>{t.regionLabel}</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={label}>Community</span>
              <span style={{ flex: 1 }}>{communities || "—"}</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={label}>Category</span>
              <span style={{ flex: 1 }}>{CATEGORY[t.category]}</span>
            </div>
          </div>
          {portrait && <div style={{ display: "flex", fontFamily: "Body", fontSize: 30, lineHeight: 1.35, marginTop: 30 }}>{story}</div>}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: portrait ? 17 : 13, color: "#6B5F55", letterSpacing: 1 }}>An archive reference — not a certificate of ownership.</div>
        </div>
        <div style={{ display: "flex", flexDirection: portrait ? "row" : "column", alignItems: portrait ? "flex-end" : "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", border: "3px solid #1B1616", background: accent.hex, padding: 10 }}>
            <Motif motif={t.motif} size={portrait ? 290 : 196} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img src={qr} width={portrait ? 230 : 150} height={portrait ? 230 : 150} alt="" />
            <span style={{ fontSize: portrait ? 16 : 12, letterSpacing: 1 }}>{shortUrl}</span>
            <span style={{ fontSize: portrait ? 15 : 11, color: accent.text, textTransform: "uppercase", letterSpacing: 3, fontWeight: 700 }}>Scan for the story</span>
          </div>
        </div>
      </div>
      <img src={STRIP} width={W} height={18} alt="" style={{ objectFit: "cover" }} />
    </div>
  );

  return new ImageResponse(element, { width: W, height: H, fonts: fontData, headers });
}
