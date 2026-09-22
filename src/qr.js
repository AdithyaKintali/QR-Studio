import qrcode from "qrcode-generator";
export const defaults = {
  type: "url",
  url: "https://example.com",
  text: "",
  email: "",
  subject: "",
  body: "",
  phone: "",
  ssid: "",
  password: "",
  security: "WPA",
  hidden: false,
  size: 1024,
  margin: 4,
  fg: "#143c30",
  bg: "#ffffff",
  end: "#176b8a",
  gradient: false,
  pattern: "square",
  ecc: "M",
  logo: "",
};
export const presets = [
  {
    name: "Classic",
    fg: "#143c30",
    bg: "#ffffff",
    gradient: false,
    pattern: "square",
  },
  {
    name: "Ocean",
    fg: "#154675",
    end: "#087969",
    bg: "#ffffff",
    gradient: true,
    pattern: "rounded",
  },
  {
    name: "Violet",
    fg: "#5928a0",
    end: "#972858",
    bg: "#ffffff",
    gradient: true,
    pattern: "dots",
  },
  {
    name: "Midnight",
    fg: "#172133",
    bg: "#edf2f7",
    gradient: false,
    pattern: "classy-rounded",
  },
];
const esc = (s) => s.replace(/([\\;,:" ])/g, "\\$1");
export function payload(s) {
  switch (s.type) {
    case "url": {
      if (!s.url.trim()) throw Error("Enter a website URL.");
      let u;
      try {
        u = new URL(s.url.trim());
      } catch {
        throw Error("Enter a complete URL, such as https://example.com.");
      }
      if (!["http:", "https:"].includes(u.protocol) || !u.hostname)
        throw Error("Use an http:// or https:// website URL.");
      return s.url.trim();
    }
    case "text":
      if (!s.text.trim())
        throw Error("Enter some text to create your QR code.");
      return s.text;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))
        throw Error("Enter a valid email address.");
      return `mailto:${s.email}${s.subject || s.body ? "?" + [s.subject && `subject=${encodeURIComponent(s.subject)}`, s.body && `body=${encodeURIComponent(s.body)}`].filter(Boolean).join("&") : ""}`;
    case "phone":
      if (
        !/^\+?[\d\s().-]{7,24}$/.test(s.phone) ||
        s.phone.replace(/\D/g, "").length < 7
      )
        throw Error("Enter a valid phone number, including the country code.");
      return "tel:" + s.phone.replace(/[\s().-]/g, "");
    case "wifi":
      if (!s.ssid.trim()) throw Error("Enter the Wi-Fi network name.");
      if (s.security !== "nopass" && !s.password)
        throw Error("Enter the Wi-Fi password.");
      return `WIFI:T:${s.security};S:${esc(s.ssid)};${s.security !== "nopass" ? `P:${esc(s.password)};` : ""}H:${s.hidden};;`;
    default:
      throw Error("Choose a QR type.");
  }
}
export function prepare(s) {
  const data = payload(s);
  if (new TextEncoder().encode(data).length > 1800)
    throw Error("This content is too long. Use fewer than 1,800 bytes.");
  const encoded = String.fromCharCode(...new TextEncoder().encode(data));
  const ecc = s.logo ? "H" : s.ecc;
  const qr = qrcode(0, ecc);
  qr.addData(encoded, "Byte");
  qr.make();
  const modules = qr.getModuleCount();
  const margin = Math.ceil((s.size * s.margin) / (modules + 2 * s.margin));
  return {
    data,
    modules,
    options: {
      type: "svg",
      width: s.size,
      height: s.size,
      data: encoded,
      margin,
      qrOptions: { errorCorrectionLevel: ecc, mode: "Byte" },
      dotsOptions: {
        type: s.pattern,
        color: s.fg,
        ...(s.gradient
          ? {
              gradient: {
                type: "linear",
                rotation: Math.PI / 4,
                colorStops: [
                  { offset: 0, color: s.fg },
                  { offset: 1, color: s.end },
                ],
              },
            }
          : {}),
      },
      backgroundOptions: { color: s.bg },
      cornersSquareOptions: { type: "extra-rounded", color: s.fg },
      cornersDotOptions: { type: "square", color: s.fg },
      image: s.logo || undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.25,
        margin: 4,
        saveAsBlob: true,
      },
    },
  };
}
function luminance(hex) {
  return hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
    .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
}
export function warnings(s, modules) {
  const colors = s.gradient ? [s.fg, s.end] : [s.fg];
  const out = [];
  if (
    colors.some((c) => (luminance(s.bg) + 0.05) / (luminance(c) + 0.05) < 4.5)
  )
    out.push(
      "Use darker QR colors on a lighter background for stronger contrast.",
    );
  if (s.margin < 4)
    out.push("Use at least 4 modules of margin for a reliable quiet zone.");
  if (s.size / (modules + 2 * s.margin) < 4)
    out.push(
      "Increase the size: dense codes need at least 4 pixels per module.",
    );
  if (s.logo)
    out.push(
      "A logo covers part of the code. High error correction is applied; test on your phone before sharing.",
    );
  if (s.gradient || s.pattern !== "square")
    out.push(
      "Styled codes can scan differently across cameras. Test the final download.",
    );
  return out;
}
export function loadRecent() {
  try {
    const a = JSON.parse(localStorage.getItem("qr-studio-recent") || "[]");
    return Array.isArray(a)
      ? a
          .filter(
            (x) =>
              x &&
              typeof x.id === "string" &&
              x.settings &&
              typeof x.settings.type === "string",
          )
          .slice(0, 8)
      : [];
  } catch {
    return [];
  }
}
