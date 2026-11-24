ALTER TABLE live_events
  ADD COLUMN IF NOT EXISTS source_event_id varchar(128);

-- A non-partial unique index is required for ON CONFLICT (source_event_id)
-- to infer the conflict target used by the ingestion route.
CREATE UNIQUE INDEX IF NOT EXISTS live_events_source_event_id_uidx
  ON live_events(source_event_id);
