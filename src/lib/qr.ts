import QRCode from "qrcode";

const INK = "#211C19";
const PAPER = "#F6F0E3";

/** QR codes use error-correction level M: robust on printed labels, still compact. */
export async function qrSvg(url: string, opts: { dark?: string; light?: string; margin?: number } = {}): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: opts.margin ?? 2,
    color: { dark: opts.dark ?? INK, light: opts.light ?? PAPER },
  });
}

export async function qrPng(url: string, size = 1024, opts: { dark?: string; light?: string } = {}): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: Math.max(128, Math.min(4096, size)),
    color: { dark: opts.dark ?? INK, light: opts.light ?? "#FFFFFF" },
  });
}

export async function qrDataUrl(url: string, size = 512): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width: size, color: { dark: INK, light: "#FFFFFF" } });
}
