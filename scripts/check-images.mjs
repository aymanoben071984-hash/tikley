#!/usr/bin/env node
/**
 * Image integrity check.
 *
 *   node scripts/check-images.mjs
 *
 * 1. Every image file under public/ and pictures/ must really be what its
 *    extension says (PNG, JPEG, WebP, SVG, WebM) — catches error pages or
 *    empty files saved with an image name.
 * 2. Every image path the code references (src/, themes, frames, crowns,
 *    avatars) must exist in public/.
 *
 * Exits with code 1 if anything is missing or broken. If this fails on a copy
 * of the project, the images were lost while copying/exporting — restore the
 * original files instead of replacing them with placeholders.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = path.join(ROOT, "public");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function sniff(buf) {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  const head = buf.toString("utf8", 0, Math.min(buf.length, 600)).trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
  if (head.includes("<html") || head.startsWith("<!doctype")) return "html";
  return buf.length === 0 ? "empty" : "unknown";
}

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "svg", "webm"]);
const problems = [];
const counts = {};

// 1) file contents
for (const base of [PUBLIC, path.join(ROOT, "pictures")]) {
  for (const f of walk(base)) {
    const ext = f.split(".").pop().toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const expected = ext === "jpeg" ? "jpg" : ext;
    const fd = fs.openSync(f, "r");
    const buf = Buffer.alloc(700);
    const n = fs.readSync(fd, buf, 0, 700, 0);
    fs.closeSync(fd);
    const got = sniff(buf.subarray(0, n));
    counts[expected] = (counts[expected] ?? 0) + 1;
    if (got !== expected) problems.push(`BROKEN  ${path.relative(ROOT, f)}  (extension .${ext}, contents look like ${got})`);
  }
}

// 2) references
const refs = new Map();
const addRef = (p, from) => {
  if (!refs.has(p)) refs.set(p, new Set());
  refs.get(p).add(from);
};
const sources = [
  ...walk(path.join(ROOT, "src")).filter((f) => /\.(tsx?|css)$/.test(f)),
  ...walk(path.join(PUBLIC, "themes")).filter((f) => /\.(html|css|js)$/.test(f)),
];
const RE = /["'`(](\/(?:avatars|assets|themes|backgrounds|quran)[^"'`()\s]*?\.(?:png|webp|jpe?g|svg|webm))/gi;
for (const f of sources) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(RE)) if (!m[1].includes("${")) addRef(m[1], path.relative(ROOT, f));
}
// templated paths used by the app
const catalog = fs.readFileSync(path.join(ROOT, "src/lib/catalog.ts"), "utf8");
for (const m of catalog.matchAll(/\{ slug: "([a-z0-9-]+)", category:/g)) addRef(`/assets/frames/${m[1]}.png`, "src/lib/catalog.ts (frames)");
for (let i = 1; i <= 17; i++) addRef(`/avatars/a${i}.png`, "src/lib/catalog.ts (avatars)");
for (let i = 1; i <= 3; i++) addRef(`/assets/img/avatar${i}.png`, "themes/cyber-blade fallback");
const themes = fs.readFileSync(path.join(ROOT, "src/lib/olThemes.ts"), "utf8");
const crownBlock = themes.slice(themes.indexOf("export const CROWNS"), themes.indexOf("export const crownUrl"));
for (const m of crownBlock.matchAll(/\["[a-z0-9-]+", "[^"]+", "([a-z0-9-]+)"\]/g)) addRef(`/assets/crowns/${m[1]}.png`, "src/lib/olThemes.ts (crowns)");

let missing = 0;
for (const [p, from] of refs) {
  if (!fs.existsSync(path.join(PUBLIC, p))) {
    missing++;
    problems.push(`MISSING ${p}  <- ${[...from].slice(0, 2).join(", ")}`);
  }
}

console.log("Image files:", Object.entries(counts).map(([k, v]) => `${v} ${k.toUpperCase()}`).join(", "));
console.log(`Referenced image paths checked: ${refs.size}, missing: ${missing}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("All images present and valid ✔");
