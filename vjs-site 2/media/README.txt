DROP YOUR HERO VIDEO HERE
=========================

Name the file exactly:   hero.webm      (or hero.mp4)

That's it. The homepage checks for this file on load. If it's here, the video
becomes the hero automatically and the still photo becomes the poster/fallback.
If it's not here, the site quietly uses the still photo with motion. Nothing breaks.

Notes:
  - Keep it under ~8 MB. Netlify serves it fine, but visitors on phones pay for it.
  - Phones deliberately keep the still image to save data.
  - No audio needed — hero videos are muted by browser rule anyway.
