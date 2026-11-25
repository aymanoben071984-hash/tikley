ALTER TABLE streamer_profiles
  ADD COLUMN IF NOT EXISTS live_session_id varchar(64);

-- Existing counters are not attributable to a confirmed current LIVE session.
UPDATE streamer_profiles
SET live_session_id = NULL,
    connection_status = CASE
      WHEN connection_status = 'live' THEN 'waiting'
      ELSE connection_status
    END,
    session_coins = 0,
    session_peak_viewers = 0,
    session_avg_viewers = 0,
    session_new_followers = 0,
    session_likes = 0,
    session_gifts = 0;
