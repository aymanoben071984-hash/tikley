#!/usr/bin/env node
/**
 * Build command used on Vercel (see vercel.json).
 *
 * 1. Checks that every image the app uses is present (catches images lost
 *    when the project was copied or uploaded). Skip with SKIP_IMAGE_CHECK=1.
 * 2. Creates / updates the database tables with drizzle-kit. Needs
 *    DATABASE_URL (or POSTGRES_URL). Skip with SKIP_DB_PUSH=1.
 * 3. Runs `next build`.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";

const run = (cmd, args, env = process.env) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  return r.status ?? 1;
};
const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

console.log("▶ Checking images…");
if (process.env.SKIP_IMAGE_CHECK === "1") {
  console.log("  skipped (SKIP_IMAGE_CHECK=1)");
} else if (run("node", ["scripts/check-images.mjs"]) !== 0) {
  fail(
    "Some images are missing or broken (list above). They were probably lost when the project was uploaded — push the full project with git (the GitHub website uploads at most 100 files at a time). To build anyway, set SKIP_IMAGE_CHECK=1.",
  );
}

console.log("\n▶ Updating database tables…");
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (process.env.SKIP_DB_PUSH === "1") {
  console.log("  skipped (SKIP_DB_PUSH=1)");
} else if (!dbUrl) {
  fail(
    "DATABASE_URL is not set. In Vercel open Project → Settings → Environment Variables and add DATABASE_URL (your Neon / PostgreSQL connection string, ending in ?sslmode=require), or connect a Neon database from the Storage tab. Then redeploy.",
  );
} else if (run("npx", ["drizzle-kit", "push", "--config=drizzle.prod.config.ts", "--force"], { ...process.env, DATABASE_URL: dbUrl }) !== 0) {
  fail("Could not update the database tables. Check that DATABASE_URL is correct and the database is reachable.");
}

console.log("\n▶ Building the app…");
process.exit(run("npx", ["next", "build"]));
