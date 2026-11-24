import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import pg from "pg";

const connectionString = process.env.TEST_DATABASE_URL;

test("PostgreSQL accepts one event across reconnect replay and concurrent duplicate deliveries", {
  skip: !connectionString && "TEST_DATABASE_URL is not configured",
}, async () => {
  const { Pool } = pg;
  const schema = `idempotency_${randomBytes(8).toString("hex")}`;
  const admin = new Pool({ connectionString });
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const pool = new Pool({
    connectionString,
    options: `-c search_path=${schema},public`,
    max: 24,
  });

  try {
    await pool.query(`
      CREATE TABLE live_events (
        id bigserial PRIMARY KEY,
        source_event_id varchar(128) UNIQUE NOT NULL,
        event_type varchar(32) NOT NULL
      );
      CREATE TABLE counters (id integer PRIMARY KEY, event_count integer NOT NULL);
      INSERT INTO counters(id, event_count) VALUES (1, 0);
    `);

    const eventId = "tiktok:reconnect:stable-event-001";
    const submit = async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const inserted = await client.query(
          "INSERT INTO live_events(source_event_id,event_type) VALUES($1,$2) ON CONFLICT(source_event_id) DO NOTHING RETURNING id",
          [eventId, "gift"],
        );
        if (inserted.rowCount === 1) {
          await client.query("UPDATE counters SET event_count=event_count+1 WHERE id=1");
        }
        await client.query("COMMIT");
        return inserted.rowCount === 1;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    };

    // Simulate a burst of concurrent duplicate deliveries during reconnect.
    const results = await Promise.all(Array.from({ length: 64 }, () => submit()));
    assert.equal(results.filter(Boolean).length, 1, "exactly one concurrent delivery must win");

    // Simulate replay from a durable worker spool after a process restart.
    assert.equal(await submit(), false, "replayed event ID must be rejected as duplicate");

    const { rows: eventRows } = await pool.query(
      "SELECT count(*)::int AS count FROM live_events WHERE source_event_id=$1",
      [eventId],
    );
    const { rows: counterRows } = await pool.query("SELECT event_count FROM counters WHERE id=1");
    assert.equal(eventRows[0].count, 1, "only one event row may persist");
    assert.equal(counterRows[0].event_count, 1, "duplicate deliveries must not increment counters");
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
