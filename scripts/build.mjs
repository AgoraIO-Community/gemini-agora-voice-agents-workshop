import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import QRCode from "qrcode";
import { normalizeJoinUrl } from "../src/join-link.js";

const config = JSON.parse(await readFile(new URL("../workshop-join.json", import.meta.url), "utf8"));
const joinUrl = normalizeJoinUrl(process.env.WORKSHOP_JOIN_URL || config.joinUrl);
if (joinUrl) {
  await writeFile(new URL("../public/workshop-join-qr.svg", import.meta.url), await QRCode.toString(joinUrl, {
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
  define: { __WORKSHOP_JOIN_URL__: JSON.stringify(joinUrl) },
  logLevel: "info"
});
