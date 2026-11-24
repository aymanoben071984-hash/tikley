import {
  boolean,
  integer,
  jsonb,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const streamerProfiles = pgTable("streamer_profiles", {
  id: serial("id").primaryKey(),
  displayName: varchar("display_name", { length: 120 }).notNull().default("Ava Stone"),
  tiktokHandle: varchar("tiktok_handle", { length: 80 }).notNull().default("@yourname"),
  avatarUrl: text("avatar_url").notNull().default("/avatars/a1.png"),
  avatarFrame: varchar("avatar_frame", { length: 80 }).notNull().default("ember-dragon"),
  bio: text("bio")
    .notNull()
    .default("Daily LIVE: games, music and chat with my community"),
  connectionStatus: varchar("connection_status", { length: 32 })
    .notNull()
    .default("test_mode"), // "test_mode" | "waiting" | "live"
  followersCount: integer("followers_count").notNull().default(5453),
  followingCount: integer("following_count").notNull().default(354),
  likesCount: integer("likes_count").notNull().default(31900),
  videosCount: integer("videos_count").notNull().default(79),
  coinsBalance: integer("coins_balance").notNull().default(42),
  sessionCoins: integer("session_coins").notNull().default(663),
  sessionPeakViewers: integer("session_peak_viewers").notNull().default(76),
  sessionAvgViewers: integer("session_avg_viewers").notNull().default(33),
  sessionNewFollowers: integer("session_new_followers").notNull().default(14),
  sessionLikes: integer("session_likes").notNull().default(116900),
  sessionGifts: integer("session_gifts").notNull().default(51),
  proPlanLabel: varchar("pro_plan_label", { length: 64 }).notNull().default("Pro · ends Oct 24"),
  locale: varchar("locale", { length: 12 }).notNull().default("en"),
  accentPreset: varchar("accent_preset", { length: 32 }).notNull().default("cyan"),
  canvasFormat: varchar("canvas_format", { length: 24 }).notNull().default("9:16"), // "9:16" (TikTok Studio) | "16:9" (OBS)
  ttsEnabled: boolean("tts_enabled").notNull().default(true),
  soundAlertsEnabled: boolean("sound_alerts_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const widgetConfigs = pgTable("widget_configs", {
  id: serial("id").primaryKey(),
  widgetKey: varchar("widget_key", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  theme: varchar("theme", { length: 80 }).notNull().default("ember-dragon"),
  animation: varchar("animation", { length: 64 }).notNull().default("pop"),
  avatarFrame: varchar("avatar_frame", { length: 80 }).notNull().default("ember-dragon"),
  primaryColor: varchar("primary_color", { length: 32 }).notNull().default("#28c7fa"),
  secondaryColor: varchar("secondary_color", { length: 32 }).notNull().default("#ff8a2b"),
  fontFamily: varchar("font_family", { length: 64 }).notNull().default("Inter"),
  scale: integer("scale").notNull().default(100),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  volume: integer("volume").notNull().default(80),
  customSettings: jsonb("custom_settings").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const avatarPresets = pgTable("avatar_presets", {
  id: serial("id").primaryKey(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  tiktokUsername: varchar("tiktok_username", { length: 80 }).notNull(),
  avatarUrl: text("avatar_url").notNull(),
  frameSlug: varchar("frame_slug", { length: 80 }).notNull().default("ember-dragon"),
  nameAnimation: varchar("name_animation", { length: 48 }).notNull().default("aurora"),
  particleFx: varchar("particle_fx", { length: 48 }).notNull().default("sparkles"),
  role: varchar("role", { length: 32 }).notNull().default("vip"),
  glowColor: varchar("glow_color", { length: 32 }).notNull().default("#ff7a18"),
  welcomeMessage: text("welcome_message").notNull().default("entered the LIVE!"),
  coinsTotal: integer("coins_total").notNull().default(1000),
  likesTotal: integer("likes_total").notNull().default(4200),
  sharesTotal: integer("shares_total").notNull().default(0),
  weeklyCoins: integer("weekly_coins").notNull().default(0),
  allTimeCoins: integer("all_time_coins").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameConfigs = pgTable("game_configs", {
  id: serial("id").primaryKey(),
  gameSlug: varchar("game_slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  isFree: boolean("is_free").notNull().default(true),
  enabled: boolean("enabled").notNull().default(true),
  cardTheme: varchar("card_theme", { length: 64 }).notNull().default("cyber-cyan"),
  roundDurationSec: integer("round_duration_sec").notNull().default(60),
  stateJson: jsonb("state_json").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const liveEvents = pgTable("live_events", {
  id: serial("id").primaryKey(),
  sourceEventId: varchar("source_event_id", { length: 128 }).unique(),
  eventType: varchar("event_type", { length: 32 }).notNull(), // gift | follow | join | chat | like | share | effect
  username: varchar("username", { length: 80 }).notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url").notNull(),
  avatarFrame: varchar("avatar_frame", { length: 80 }).notNull().default("ember-dragon"),
  giftId: varchar("gift_id", { length: 48 }),
  giftName: varchar("gift_name", { length: 80 }),
  giftIcon: text("gift_icon"),
  coins: integer("coins").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  message: text("message"),
  effectKey: varchar("effect_key", { length: 48 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface SceneLayerItem {
  id: string;
  widgetKey: string;
  label: string;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  width: number; // percentage 15..100
  scale: number;
  visible: boolean;
  zIndex: number;
}

export const linkScenes = pgTable("link_scenes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  platform: varchar("platform", { length: 48 }).notNull().default("tiktok_studio"), // tiktok_studio | obs
  aspectRatio: varchar("aspect_ratio", { length: 16 }).notNull().default("9:16"),
  layersJson: jsonb("layers_json").$type<SceneLayerItem[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const topBoards = pgTable("top_boards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  lastResetAt: timestamp("last_reset_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const giftActions = pgTable("gift_actions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  screen: integer("screen").notNull().default(1), // 1–6
  trigger: varchar("trigger", { length: 16 }).notNull().default("gift"), // gift | coins | likes | follow | share | join
  giftId: varchar("gift_id", { length: 48 }),
  minCount: integer("min_count").notNull().default(1),
  threshold: integer("threshold").notNull().default(1000),
  progress: integer("progress").notNull().default(0),
  mediaType: varchar("media_type", { length: 16 }).notNull().default("effect"), // effect | video | gif
  mediaUrl: text("media_url").notNull().default(""),
  effect: varchar("effect", { length: 32 }).notNull().default("fireworks"),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  soundName: varchar("sound_name", { length: 32 }).notNull().default("fanfare"),
  soundUrl: text("sound_url").notNull().default(""),
  volume: integer("volume").notNull().default(80),
  durationSec: integer("duration_sec").notNull().default(6),
  size: integer("size").notNull().default(100),
  position: varchar("position", { length: 16 }).notNull().default("center"),
  fit: varchar("fit", { length: 12 }).notNull().default("contain"),
  showCaption: boolean("show_caption").notNull().default(true),
  caption: varchar("caption", { length: 160 }).notNull().default("{name} sent {gift}!"),
  cooldownSec: integer("cooldown_sec").notNull().default(0),
  lastFiredAt: timestamp("last_fired_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actionQueue = pgTable("action_queue", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull(),
  screen: integer("screen").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  giftName: varchar("gift_name", { length: 80 }).notNull().default(""),
  amount: integer("amount").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const overlayDisplays = pgTable("overlay_displays", {
  id: serial("id").primaryKey(),
  overlayKey: varchar("overlay_key", { length: 120 }).notNull().unique(),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const overlayHeartbeats = pgTable("overlay_heartbeats", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 80 }).notNull().unique(),
  overlayTarget: varchar("overlay_target", { length: 80 }).notNull(),
  platformHint: varchar("platform_hint", { length: 48 }).notNull().default("Browser / OBS"),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

export type StreamerProfile = typeof streamerProfiles.$inferSelect;
export type WidgetConfig = typeof widgetConfigs.$inferSelect;
export type AvatarPreset = typeof avatarPresets.$inferSelect;
export type GameConfig = typeof gameConfigs.$inferSelect;
export type LiveEvent = typeof liveEvents.$inferSelect;
export type LinkScene = typeof linkScenes.$inferSelect;
export type OverlayHeartbeat = typeof overlayHeartbeats.$inferSelect;
export type TopBoardRow = typeof topBoards.$inferSelect;
export type GiftAction = typeof giftActions.$inferSelect;
export type ActionQueueRow = typeof actionQueue.$inferSelect;


export const authUsers = pgTable("auth_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 24 }).notNull().default("admin"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("auth_sessions_user_id_idx").on(table.userId),
  expiresAtIdx: index("auth_sessions_expires_at_idx").on(table.expiresAt),
}));

export const authLoginAttempts = pgTable("auth_login_attempts", {
  keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowEndsAt: timestamp("window_ends_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
