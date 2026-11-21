# Images in this project

The app uses **real raster image files** (PNG, WebP, JPG). There are no SVG placeholders standing in for missing images.

| Where | What | Format |
| --- | --- | --- |
| `public/avatars/` | 17 viewer / creator avatars | PNG |
| `public/assets/frames/` | 68 avatar frames | PNG |
| `public/assets/marketing/` | 11 leaderboard, goal and nameplate artworks + dashboard screenshot | WebP, JPG |
| `public/assets/gifts/` | TikTok gift images | PNG |
| `public/assets/crowns/` | 33 crowns for the #1 spot | PNG |
| `public/assets/social/` | 19 Social Media frames + animation layers | WebP, PNG |
| `public/assets/img/` | fallback avatars used by the Voltage leaderboard theme | PNG |
| `public/themes/top-lists/` | 43 leaderboard themes with their row, frame, crown and plate art | PNG, WebP |
| `public/backgrounds/` | 8 painted stream backgrounds | JPG |
| `pictures/` | browsable copies of the main images | PNG, WebP, JPG |

SVG is only used where it is the right format: the country flags (`public/assets/flags/`), the OverlayLive logo and the Stream Deck key icons.

## Check a copy of the project

```bash
node scripts/check-images.mjs
```

It confirms every image file really is a PNG / JPEG / WebP / SVG / WebM (not an error page saved with an image name) and that every image path the code uses exists. Expected result:

```
Image files: 323 PNG, 18 JPG, 44 WEBP, …
Referenced image paths checked: 255, missing: 0
All images present and valid ✔
```

## If images are missing in a copy

That means they were lost while the project was copied, not that the code points to the wrong files. Common causes:

- **Uploading through the GitHub website** — it takes at most 100 files per upload, so large folders like `public/assets/frames/` or `public/themes/` get left behind. Push with `git` instead (`git add . && git commit && git push`).
- **A zip or export with a size limit** — `public/` is about 180 MB because of the leaderboard theme and frame artwork.
- **Tools that skip binary files.**

Restore the original files from the full project instead of generating placeholders. Placeholders keep the build working but replace the real artwork with blank shapes.

## Changes in this pass

- Added `public/assets/img/avatar1.png`–`avatar3.png`. The Voltage theme shows these when a viewer has no profile photo; they were the only referenced images that did not exist. OverlayLive's own copies return 404, so they are the project's own avatars `a1`–`a3`.
- Added `scripts/check-images.mjs`.
- No catalog paths needed changes: every frame, avatar, artwork and theme path already points to an existing raster file.
