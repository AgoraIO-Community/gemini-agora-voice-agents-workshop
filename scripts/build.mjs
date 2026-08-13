import { build } from "esbuild";

await build({
  entryPoints: ["src/browser.js"],
  bundle: true,
  format: "iife",
  outfile: "assets/workshop-session.js",
  sourcemap: true,
  minify: true,
  target: ["es2020"],
  logLevel: "info"
});
