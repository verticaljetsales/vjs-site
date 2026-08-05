# VJS Content Studio — Visual Style

Every post ships as a finished, **logo-branded** graphic — never bare text and
never a raw photo. The composer (`tools/compose-visuals.cjs`) renders them at
**1080 × 1350** (portrait, the strongest size for Instagram/Facebook/LinkedIn
feeds) using the real VJS typography and mark.

## Non-negotiables
- **The VJS logo appears on every single post.** (The gold aircraft + wordmark.)
- **Brand palette:** night `#0B1520`, gold `#C6A15B`, gold-bright `#DcBd80`,
  bone `#E9E5DC`.
- **Typography:** Playfair Display for headlines, Archivo for everything else —
  the exact faces used on verticaljetsales.com (bundled in `tools/fonts/`).
- **verticaljetsales.com** is shown on every post; `@verticaljetsales` on photo
  posts.

## Two templates (auto-selected)
1. **Photo post** — a real aircraft photo, darkened toward the bottom, with a
   status badge (top-left), the logo, a Playfair headline, a spec line
   (`YEAR MODEL · CATEGORY`), and the handle/site strip. Used whenever the post
   is tied to a listing with a usable photo.
2. **Quote-card** — a night background with a soft gold glow, a pillar eyebrow
   ("Market Intelligence", "From the Team", …), a large Playfair headline, an
   optional subline, and the logo + site in the footer. Used for market,
   education, and founder posts that aren't about one specific airplane.

## Steering the words on a graphic
By default the headline is the post's `hook`. Override per post with:
- `visual_headline` — the big line
- `visual_subline` — the small line beneath it
- `visual_kicker` — the badge / eyebrow

Then re-run `node tools/compose-visuals.cjs <id>` to rebuild just that one.

## What this does NOT do
- It does not produce finished **video**. For Reels/TikTok the composer makes a
  branded **cover frame**; the moving cut still needs production (film to the
  shot list, an editor, or a motion-from-photos / AI-video step — a choice
  captured in `docs/CONTENT-PLATFORM.md`).
- Carousels: the composer makes the lead slide; extra slides are the listing
  photos in `media`.
