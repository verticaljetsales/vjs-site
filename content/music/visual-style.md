# Ben McPeak Content Studio — Visual Style

Every post ships as a finished, **branded** graphic — never bare text, never a
raw screenshot. The composer (`tools/compose-music-visuals.cjs`) renders them at
**1080 × 1350** (portrait, the strongest feed size for Instagram/Facebook) and
**1080 × 1920** for vertical video (TikTok / Reels / Shorts), using a warm
Texas-country identity.

## The mark
Every post carries the **BEN McPEAK wordmark** — no exceptions. By default the
composer renders it typographically (Playfair Display, amber) so the studio
works with zero setup. **If Ben has a real logo,** drop a PNG at
`media/music/logo.png` and the composer uses it automatically on every post.

## Non-negotiables
- **The wordmark (or logo) appears on every single post.**
- **benmcpeakmusic.com** appears on every post; **@benmcpeakmusic** on
  performance/photo posts.
- **Palette (warm, worn-in, Texas):**
  - night `#1A1712` (dark roast)
  - amber `#D69A3C` (whiskey gold — primary accent)
  - rust `#B4512E` (secondary accent, use sparingly)
  - cream `#F1E6D2` (text on dark)
  - muted `#B8A98F`
- **Typography:** Playfair Display for headlines (timeless, neo-traditional),
  Archivo for everything else. Bundled in `tools/fonts/`, so rendering is
  offline. Swap the display face here if the brand evolves.

## Templates (auto-selected)
1. **Performance / photo post** — used whenever the post has a usable photo (a
   live shot, a portrait, cover art). Two layouts via the `layout` field:
   - **`full-bleed`** *(default for music)* — the photo fills the frame with the
     wordmark, headline, and handle overlaid on a warm gradient. Cinematic — the
     right default for live and portrait shots.
   - **`framed`** — the whole image sits in a top panel with a branded band
     beneath (wordmark, Playfair headline, sub-line, handle strip). Best for
     cover art or a shot you don't want cropped.
2. **Lyric card** — a warm, dark background with a soft amber glow, a small
   eyebrow (song title / "New Music" / "Live"), a large Playfair line, a
   sub-line, and the wordmark + site in the footer. Use for lyric teases,
   quotes, and announcements that aren't built on one photo. **Only real lyrics**
   go on a lyric card (a song's confirmed `signature_lyric`); otherwise write an
   original line *about* the song, not a fake quote.

Headlines auto-size to fit, so a long line shrinks rather than overflowing.

## Steering the words on a graphic
By default the headline is the post's `hook`. Override per post with:
- `visual_headline` — the big line
- `visual_subline` — the small line beneath it
- `visual_kicker` — the badge / eyebrow (e.g. "New Single", "Live in Bandera")

Then re-run `node tools/compose-music-visuals.cjs <id>` to rebuild that one.

## Video (motion-from-photo)
For Reels / TikTok / Shorts, `tools/compose-music-video.cjs` builds a vertical
**1080×1920** clip from the post's photos: a slow Ken Burns zoom/pan, the
wordmark + headline framed on top, gentle crossfades, and a branded end card
with the CTA. **Audio matters most here:** by default the studio does NOT mix in
music (so you can drop the clip over the actual song or a trending sound in-app).
Set `"audio": "tools/audio/..."` on the item only if you have a cleared bed.
Output is `media/music/generated/<id>.mp4`, recorded on the item's `video` field.
Requires **ffmpeg** in the session.

## The audio reality (read this)
The single best-performing music content is **Ben's real voice** — a phone clip
of him singing the actual song. The composer can brand photos and build
motion graphics, but it **cannot generate a performance**. For every
performance-style script, the deliverable is a *shot/recording list* telling Ben
exactly what to film (e.g. "verse 1 of Hurry Up Whiskey, straight to camera,
truck tailgate, golden hour"). Film to the script, drop it in, and the studio
brands the rest.

## What this does NOT do
- No AI-generated music, vocals, or footage. Performance clips are filmed by
  Ben/team to the studio's shot list.
- Carousels: the composer makes the lead slide; extra slides are the photos in
  `media`.
