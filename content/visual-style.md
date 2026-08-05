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

## Templates (auto-selected)
1. **Photo post** — used whenever the post is tied to a listing with a usable
   photo. Comes in two layouts, chosen per post via the `layout` field:
   - **`framed`** *(default)* — the **whole aircraft** sits in a top panel
     (nothing cropped), with a branded band beneath holding the logo, a Playfair
     headline, the spec line (`YEAR MODEL · CATEGORY`), and the handle/site
     strip. Best for a brokerage — the airplane is the product.
   - **`full-bleed`** — the photo fills the entire frame with the branding
     overlaid. More cinematic, but it crops the ends of the aircraft, so only
     use it when a photo is loosely framed. Opt in with `"layout": "full-bleed"`.
2. **Quote-card** — a night background with a soft gold glow, a pillar eyebrow
   ("Market Intelligence", "From the Team", …), a large Playfair headline, a
   subline (defaults to the post's CTA), and the logo + site in the footer.
   Used for market, education, and founder posts that aren't about one airplane.

Headlines auto-size to the space, so a long hook shrinks to fit rather than
overflowing. The logo is always rendered at its true 520×276 aspect.

## Steering the words on a graphic
By default the headline is the post's `hook`. Override per post with:
- `visual_headline` — the big line
- `visual_subline` — the small line beneath it
- `visual_kicker` — the badge / eyebrow

Then re-run `node tools/compose-visuals.cjs <id>` to rebuild just that one.

## Video (motion-from-photo)
For reels / TikToks, `tools/compose-video.cjs` builds a vertical **1080×1920**
video from the listing photos: a slow Ken Burns zoom/pan over each photo, the
logo + headline framed on top, gentle crossfades between shots, and a branded
end card with the call-to-action. Silent by default (music can be added later).
Output is `media/generated/<id>.mp4`, recorded on the item's `video` field.
Requires **ffmpeg** in the session.

## What this does NOT do
- No live filming or AI-generated footage — video is built from the photos you
  already have. For a hero film, shoot to the post's shot list instead.
- Carousels: the composer makes the lead slide; extra slides are the listing
  photos in `media`.
