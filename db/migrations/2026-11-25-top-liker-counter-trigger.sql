-- Top Likers counters are maintained from committed live_events rows.
-- This avoids drift when event ingestion runs on an older app instance and keeps
-- counter updates tied to the same insert that is protected by source_event_id uniqueness.

CREATE UNIQUE INDEX IF NOT EXISTS avatar_presets_tiktok_username_norm_uidx
  ON avatar_presets (lower(ltrim(tiktok_username, '@')));

CREATE OR REPLACE FUNCTION apply_live_like_to_avatar_preset()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_username text;
BEGIN
  IF NEW.event_type <> 'like' OR COALESCE(NEW.likes, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  normalized_username := lower(ltrim(btrim(COALESCE(NEW.username, '')), '@'));
  IF normalized_username = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO avatar_presets (
    display_name, tiktok_username, avatar_url, frame_slug,
    coins_total, likes_total, shares_total, weekly_coins, all_time_coins, is_pinned
  )
  VALUES (
    COALESCE(NULLIF(NEW.display_name, ''), normalized_username),
    '@' || normalized_username,
    COALESCE(NULLIF(NEW.avatar_url, ''), '/avatars/a1.png'),
    COALESCE(NULLIF(NEW.avatar_frame, ''), 'ember-dragon'),
    0, NEW.likes, 0, 0, 0, false
  )
  ON CONFLICT ((lower(ltrim(tiktok_username, '@'))))
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = CASE
      WHEN EXCLUDED.avatar_url <> '/avatars/a1.png' THEN EXCLUDED.avatar_url
      ELSE avatar_presets.avatar_url
    END,
    likes_total = avatar_presets.likes_total + EXCLUDED.likes_total;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS live_events_apply_like_to_avatar_preset ON live_events;
CREATE TRIGGER live_events_apply_like_to_avatar_preset
AFTER INSERT ON live_events
FOR EACH ROW
EXECUTE FUNCTION apply_live_like_to_avatar_preset();

-- Create missing real liker profiles without overwriting existing seeded totals.
WITH totals AS (
  SELECT lower(ltrim(username, '@')) AS handle, SUM(likes)::int AS likes_total
  FROM live_events
  WHERE event_type = 'like' AND COALESCE(likes, 0) > 0
  GROUP BY lower(ltrim(username, '@'))
),
latest AS (
  SELECT DISTINCT ON (lower(ltrim(username, '@')))
    lower(ltrim(username, '@')) AS handle, display_name, avatar_url, avatar_frame
  FROM live_events
  WHERE event_type = 'like' AND COALESCE(likes, 0) > 0
  ORDER BY lower(ltrim(username, '@')), created_at DESC, id DESC
)
INSERT INTO avatar_presets (
  display_name, tiktok_username, avatar_url, frame_slug,
  coins_total, likes_total, shares_total, weekly_coins, all_time_coins, is_pinned
)
SELECT
  COALESCE(NULLIF(latest.display_name, ''), totals.handle),
  '@' || totals.handle,
  COALESCE(NULLIF(latest.avatar_url, ''), '/avatars/a1.png'),
  COALESCE(NULLIF(latest.avatar_frame, ''), 'ember-dragon'),
  0, totals.likes_total, 0, 0, 0, false
FROM totals
LEFT JOIN latest ON latest.handle = totals.handle
ON CONFLICT DO NOTHING;
