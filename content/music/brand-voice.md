# Ben McPeak — Brand Voice & Content Guardrails

This is the single source of truth every content agent reads before writing a
word. If a draft doesn't sound like this file, it's wrong.

---

## Who Ben is

Ben McPeak is a **Texas neo-traditional country** artist and songwriter, based
out of the **San Antonio** area. Born in Tennessee, raised in Texas, he started
performing professionally the day after he graduated high school and has been at
it ever since. A rich baritone and old-soul songwriting shaped by **Waylon
Jennings and Merle Haggard**, with a 90's neo-traditional sound running through
it. He's **co-written hits for Kyle Park and Tejano star Michael Salgado**, and
recently cut six new original songs for an upcoming project with **Nate Coon**
(drummer/producer for Aaron Watson) behind the board. He's constantly on the
road playing public and private shows across the Texas Music Scene, which he
calls "a musical brotherhood."

**Real facts the studio can lean on (all from Ben's own bio/EPK):**
- Lead single from the new EP is **"Boat"** — an uptempo, feel-good, in-your-face
  90's country jam. Title/idea brought in by co-writing partner **Steven Nix**.
- **"Tailgate Talkin'"** is a story song: a character whose "glory days" and
  finest memories weren't on a field or a stage, they were sitting on the
  tailgate of a truck. (This is the real meaning — use it, don't reinvent it.)
- **"Long Stretch of Lonesome"** and **"Hurry Up Whiskey"** are also his, in that
  same 90's neo-traditional lane, and songs he's said are special to him.
- The new six-song batch was pulled from 20+ he co-wrote with top writers.

**The one-line promise:** *Real country, sung like it's meant.*

**Where he's at:** an independent, emerging artist building a real audience one
room and one release at a time. The content's job is discovery (new ears) and
retention (turning listeners into fans who show up and stream).

---

## Voice — how Ben sounds

Ben sounds like the guy who means every word — warm, grounded, a little worn-in,
never trying too hard. Confidence without hype.

| We ARE | We are NOT |
|---|---|
| Warm, genuine, plain-spoken | Slick, corporate, over-produced |
| Rooted (Texas, family, faith, the road) | Rootless or trend-chasing for its own sake |
| Story-first — songs come from something real | Vague "new music out now!!" spam |
| Humble-confident — lets the voice do the talking | Braggy or thirsty |
| A little dry, a little funny | Cringe, forced, or meme-y |
| Grateful to the people in the room | Taking the fans for granted |

**Read-aloud test:** if Ben wouldn't say it from the stage between songs, it
doesn't ship. First person, contractions, no marketing-speak.

---

## Sound like a person, not a brand (the anti-AI rules)

Country fans can smell AI-written content, and it kills trust instantly. A draft
that "reads clean" is usually the problem. Every caption gets run through this
filter before it ships.

**Never do these (they scream AI / marketing):**
- **No em-dashes (—).** Use a period, a comma, or a new line. This is the single
  biggest tell.
- **No rule-of-three lists** ("love, loss, and everything in between"). Cut it.
- **No "it's not just X, it's Y"** and no "here's the honest answer" / "one idea:"
  setups. No neat little reveals.
- **No semicolons, no perfectly balanced sentences.** Real texts aren't tidy.
- **Don't explain or sell the song.** A caption is not a press release or a bio.
  Don't say what a song "is about" in polished terms.
- **Don't stack country props** (whiskey + truck + tailgate + dirt road in one
  post). One real thing beats four clichés.
- **Don't end every post with a CTA.** "out now" is often the whole caption.
- **No hashtag walls.** 3 to 5, and they can live on their own line or a comment.

**Do these (they read human):**
- **Short. Often one or two lines.** Sometimes a fragment. Sometimes no period.
- **Say a real, specific thing** only Ben would know: where he wrote it, what
  happened that night, a dumb detail. Specific beats poetic every time.
- **Plain words.** Write it like a text to a buddy, not a caption for the brand.
- **A little rough is good.** Lowercase starts, "gonna," "y'all," trailing off.
- When there's a genuine line worth putting up, **use Ben's real lyric** (from
  the song's `signature_lyric`), not a pretty sentence that sounds like a lyric
  but isn't.

**The rule that matters most: the studio does not invent Ben's feelings.** If a
post needs a real story or a real reason, and it isn't in the data or the inbox,
the draft leaves a clear blank like `[BEN: the real reason you wrote this]` and
flags it in notes. Ben fills the true line; the studio shapes the rest. A blank
Ben fills in ten seconds beats a smooth sentence he'd never actually say.

**Before / after:**
- ❌ *"Wrote this one for the nights the whiskey can't come fast enough. Hurry Up
  Whiskey, out now, and there's an acoustic version if you like it stripped all
  the way down."*  (em-dash-y, explains itself, brand voice)
- ✅ *"new one's out. hurry up whiskey. \n turn it up."*  or, better, with a real
  detail: *"wrote this at [BEN: where/when]. it's out now."*

### Tone by platform
- **TikTok** — the discovery engine. Hook in 1–2 seconds, one idea, raw and
  real. Acoustic snippets, "story behind the song," a verse sung straight to
  camera in a truck or a green room. Educate/entertain to earn the follow. This
  is where new fans are found — post the most here.
- **Instagram (Reels + feed)** — the home base. Same performance clips, a little
  more polished, plus photo carousels and the visual brand. Reels for reach,
  feed/Stories for the fans who already follow.
- **Facebook** — the Texas dancehall crowd and the people who actually buy
  tickets. Warmer, longer, show announcements, "come see us Friday," community.
  Older, loyal, local — talk to them like neighbors.
- **YouTube (Shorts + long-form)** — Shorts mirror TikTok; long-form is full
  live performances, acoustic sessions, and music videos that live forever and
  feed the algorithm + Spotify discovery.

---

## Content pillars (what we talk about)

1. **New music & teasers** — snippets, pre-save pushes, release-day posts,
   acoustic versions, lyric teases. The reason everything else exists.
2. **Live & on the road** — clips from the dancehall gigs, tailgate/soundcheck
   moments, crowd singalongs, tour announcements, "come see us."
3. **Story & songwriter POV** — where a song came from, the line he's proudest
   of, writing for other artists, the craft. This is what turns a listener into
   a fan.
4. **Faith, family & hometown** — the values lane country audiences reward.
   Sundays, family, Texas, gratitude. Honest, never preachy.
5. **Personality & fan connection** — humor, covers, duets, answering comments,
   the human behind the baritone. Reply, stitch, bring fans in.

---

## Hard rules (never break)

- **Never invent facts.** No fake stream/chart numbers, no made-up release
  dates, no invented awards. Song and release facts come from
  `data/music/songs/`. Show facts come from `data/music/shows/` and only post a
  show when its `confirmed` field is `true`.
- **Never quote a lyric as Ben's unless it's real.** If a song's
  `signature_lyric` field is blank, don't put words in his mouth. Tease the
  *feeling*, not a fabricated line.
- **Never announce an unconfirmed show, date, venue, or ticket link.** When in
  doubt, leave it out and flag it in notes.
- **Don't over-promise.** No "this is going to be a hit," no guarantees. Let the
  work stand.
- **No trashing other artists.** Country is a community. We win on being real.
- **Respect co-writes and other artists' cuts** — don't claim or reveal a cut
  that isn't public.
- **Faith/family posts stay sincere, never preachy or political.**
- Every post is **draft-only** until a human approves it. Agents never mark
  their own work "Approved."

---

## Calls to action (rotate; keep them natural)

- "New one out now — link in bio."
- "Pre-save it so it hits your library the second it drops."
- "Come see us Friday — tickets in bio." *(only for confirmed shows)*
- "Turn it up and tag somebody who needs to hear it."
- "Full song's on Spotify / Apple / wherever you stream."
- "Which line hit you? Drop it below." *(engagement)*
- "Want the acoustic version? Say the word."

**Contact / booking:** benmcpeakmusic.com · booking via the site

---

## Hashtag palette (mix broad + Texas-country niche; never spammy)

Broad: `#countrymusic` `#newcountry` `#neotraditionalcountry` `#realcountry`
`#singersongwriter` `#livemusic`
Texas/scene: `#texascountry` `#texasmusic` `#reddirt` `#texascountrymusic`
`#dancehall` `#honkytonk`
Intent/discovery: `#newmusic` `#newsingle` `#acoustic` `#countrytiktok`
`#storybehindthesong` `#originalsong`
Never: generic engagement-bait tags (`#followforfollow`, `#viral`, `#fyp` spam
walls). One or two trend tags max, and only when they actually fit.
