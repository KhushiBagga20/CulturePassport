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

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 700 | 800; style: "normal" | "italic" }[]> | null = null;
function fonts() {
  fontsPromise ??= Promise.all([
    font("bricolage-grotesque", "bricolage-grotesque-latin-800-normal.woff").then((data) => ({ name: "Display", data, weight: 800 as const, style: "normal" as const })),
    font("instrument-serif", "instrument-serif-latin-400-italic.woff").then((data) => ({ name: "Serif", data, weight: 400 as const, style: "italic" as const })),
    font("instrument-serif", "instrument-serif-latin-400-normal.woff").then((data) => ({ name: "Serif", data, weight: 400 as const, style: "normal" as const })),
    font("ibm-plex-mono", "ibm-plex-mono-latin-400-normal.woff").then((data) => ({ name: "Mono", data, weight: 400 as const, style: "normal" as const })),
    font("ibm-plex-mono", "ibm-plex-mono-latin-500-normal.woff").then((data) => ({ name: "Mono", data, weight: 500 as const, style: "normal" as const })),
  ]);
  return fontsPromise;
}

const STRIP = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="18"><rect width="1200" height="18" fill="#581D30"/>${Array.from({ length: 43 })
    .map((_, i) => `<path d="M${i * 28 + 14} 2 L${i * 28 + 21} 9 L${i * 28 + 14} 16 L${i * 28 + 7} 9Z" fill="#E4AA29"/><circle cx="${i * 28 + 14}" cy="9" r="2" fill="#581D30"/>`)
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

  const element = (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#F6F0E3", color: "#211C19", fontFamily: "Mono" }}>
      <img src={STRIP} width={W} height={18} alt="" style={{ objectFit: "cover" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          margin: portrait ? 44 : 30,
          border: `3px solid ${accent.hex}`,
          padding: portrait ? 48 : 34,
          gap: portrait ? 36 : 36,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: portrait ? 22 : 17, letterSpacing: 4, textTransform: "uppercase" }}>
            <span style={{ color: accent.hex, fontWeight: 500 }}>Culture Passport</span>
            <span style={{ color: "#7A6D62" }}>No. {t.passportNo}</span>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Display",
              fontSize: portrait ? 104 : 68,
              lineHeight: 0.92,
              textTransform: "uppercase",
              marginTop: portrait ? 34 : 18,
              letterSpacing: -2,
            }}
          >
            {t.name}
          </div>
          <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontSize: portrait ? 44 : 30, color: accent.hex, marginTop: 14 }}>{t.tagline}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: portrait ? 34 : 18, fontSize: portrait ? 21 : 15, gap: 8 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ color: "#7A6D62", width: portrait ? 150 : 110, textTransform: "uppercase", letterSpacing: 2 }}>Region</span>
              <span style={{ flex: 1 }}>{t.regionLabel}</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ color: "#7A6D62", width: portrait ? 150 : 110, textTransform: "uppercase", letterSpacing: 2 }}>Community</span>
              <span style={{ flex: 1 }}>{communities || "—"}</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ color: "#7A6D62", width: portrait ? 150 : 110, textTransform: "uppercase", letterSpacing: 2 }}>Category</span>
              <span style={{ flex: 1 }}>{CATEGORY[t.category]}</span>
            </div>
          </div>
          {portrait && (
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: 34, lineHeight: 1.22, marginTop: 34 }}>{story}</div>
          )}
          <div style={{ display: "flex", flex: 1 }} />
          <div style={{ display: "flex", fontSize: portrait ? 17 : 13, color: "#7A6D62", letterSpacing: 1 }}>
            An archive reference — not a certificate of ownership.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: portrait ? "row" : "column", alignItems: portrait ? "flex-end" : "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", border: "2px solid #211C19" }}>
            <Motif motif={t.motif} size={portrait ? 300 : 210} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img src={qr} width={portrait ? 230 : 150} height={portrait ? 230 : 150} alt="" />
            <span style={{ fontSize: portrait ? 16 : 12, letterSpacing: 1 }}>{shortUrl}</span>
            <span style={{ fontSize: portrait ? 15 : 11, color: accent.hex, textTransform: "uppercase", letterSpacing: 3 }}>Scan for the story</span>
          </div>
        </div>
      </div>
      <img src={STRIP} width={W} height={18} alt="" style={{ objectFit: "cover" }} />
    </div>
  );

  return new ImageResponse(element, { width: W, height: H, fonts: fontData, headers });
}
