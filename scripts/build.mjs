import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import QRCode from "qrcode";
import { normalizeJoinUrl } from "../src/join-link.js";

const config = JSON.parse(await readFile(new URL("../workshop-join.json", import.meta.url), "utf8"));
const joinUrl = normalizeJoinUrl(process.env.WORKSHOP_JOIN_URL || config.joinUrl);
const qrUrl = normalizeJoinUrl(process.env.WORKSHOP_QR_URL || config.qrUrl);
if (qrUrl) {
  await writeFile(new URL("../public/workshop-join-qr.svg", import.meta.url), await QRCode.toString(qrUrl, {
    type: "svg", errorCorrectionLevel: "M", margin: 4,
    color: { dark: "#000000", light: "#ffffff" }
  }));
}

await build({
  entryPoints: ["src/browser.js"],
  bundle: true,
  format: "iife",
  outfile: "public/assets/workshop-session.js",
  sourcemap: true,
  minify: true,
  target: ["es2020"],
  define: { __WORKSHOP_JOIN_URL__: JSON.stringify(joinUrl), __WORKSHOP_QR_URL__: JSON.stringify(qrUrl) },
  logLevel: "info"
});

await build({
  entryPoints: ["src/host-notes.js"],
  bundle: true,
  format: "iife",
  outfile: "public/assets/host-notes.js",
  sourcemap: true,
  minify: true,
  target: ["es2020"],
  logLevel: "info"
});
