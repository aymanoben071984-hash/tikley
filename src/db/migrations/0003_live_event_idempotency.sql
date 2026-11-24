ALTER TABLE live_events
  ADD COLUMN IF NOT EXISTS source_event_id varchar(128);

CREATE UNIQUE INDEX IF NOT EXISTS live_events_source_event_id_uidx
  ON live_events(source_event_id)
  WHERE source_event_id IS NOT NULL;
