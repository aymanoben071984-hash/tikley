import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Database config for an online (production) database — used by the Vercel
 * build (scripts/vercel-build.mjs) and by manual pushes:
 *
 *   DATABASE_URL="postgresql://..." npx drizzle-kit push --config=drizzle.prod.config.ts
 */
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Add it to your environment or .env file first.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
