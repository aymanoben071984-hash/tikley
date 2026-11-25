import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ingestRouteUrl = new URL("../../src/app/api/tiktok/ingest/route.ts", import.meta.url);

test("TikTok ingestion dispatches events in-process without deriving an origin from request.url", async () => {
  const source = await readFile(ingestRouteUrl, "utf8");

  assert.match(source, /import \{ POST as handleEventsPost \} from ["']@\/app\/api\/events\/route["']/);
  assert.match(source, /return handleEventsPost\(new Request\(/);
  assert.match(source, /authorization: `Bearer \$\{secret\}`/);
  assert.doesNotMatch(source, /new URL\(request\.url\)/);
  assert.doesNotMatch(source, /fetch\s*\(/);
});

test("the in-process dispatch keeps the worker event payload and JSON content type", async () => {
  const source = await readFile(ingestRouteUrl, "utf8");

  assert.match(source, /"content-type": "application\/json"/);
  assert.match(source, /body: JSON\.stringify\(payload\)/);
  assert.match(source, /sourceEventId,/);
  assert.match(source, /sessionId,/);
});
