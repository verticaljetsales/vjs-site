#!/usr/bin/env bash
# Repackages the Music Content Studio out of this repo into a clean, standalone
# site ready to push to the verticaljetsales/benmcpeak-studio repo and deploy on
# Netlify at studio.benmcpeakmusic.com. Music files only — no jet content.
#
# Usage:  bash scripts/package-music-studio.sh [DEST]
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-/home/user/benmcpeak-studio}"

rm -rf "$DEST"; mkdir -p "$DEST"
mkdir -p "$DEST/content"; cp -r "$SRC/content/music" "$DEST/content/music"
mkdir -p "$DEST/data";    cp -r "$SRC/data/music"    "$DEST/data/music"
mkdir -p "$DEST/media";   cp -r "$SRC/media/music"   "$DEST/media/music"
mkdir -p "$DEST/tools/fonts"
cp "$SRC/tools/compose-music-visuals.cjs" "$SRC/tools/compose-music-video.cjs" "$DEST/tools/"
cp "$SRC/tools/build-music-publer-csv.cjs" "$SRC/tools/music-publer-push.cjs" "$DEST/tools/"
cp -r "$SRC/tools/fonts/." "$DEST/tools/fonts/"
cp "$SRC/build-music-index.js" "$DEST/build-music-index.js"
mkdir -p "$DEST/.github/workflows"; cp "$SRC/.github/workflows/music-publer.yml" "$DEST/.github/workflows/music-publer.yml"
mkdir -p "$DEST/admin"; cp "$SRC/admin/index.html" "$DEST/admin/index.html"
mkdir -p "$DEST/.claude/skills"; cp -r "$SRC/.claude/skills/music-content-studio" "$DEST/.claude/skills/music-content-studio"
mkdir -p "$DEST/docs"; cp "$SRC/docs/MUSIC-CONTENT-PLATFORM.md" "$DEST/docs/"
cp "$SRC/music-studio.html" "$DEST/index.html"
cp "$SRC/music-studio.html" "$DEST/music-studio.html"

# Standalone CMS config: music collections only, backend -> the new repo.
START=$(grep -n '^  - name: "music_content"' "$SRC/admin/config.yml" | head -1 | cut -d: -f1)
{
  cat <<'HEADER'
backend:
  name: github
  repo: verticaljetsales/benmcpeak-studio
  branch: main

media_folder: "media/music/uploads"
public_folder: "/media/music/uploads"

media_libraries:
  default:
    config:
      slugify_filename: true
      max_file_size: 26214400
      transformations:
        raster_image:
          format: webp
          quality: 82
          width: 2600
          height: 2600
        svg:
          optimize: true

collections:
HEADER
  tail -n +"$START" "$SRC/admin/config.yml"
} > "$DEST/admin/config.yml"

cat > "$DEST/netlify.toml" <<'EOF'
[build]
  publish = "."
  command = "node build-music-index.js"

[[headers]]
  for = "/data/*"
  [headers.values]
    Content-Type = "application/json"
    Cache-Control = "no-store"

[[headers]]
  for = "/media/*"
  [headers.values]
    Cache-Control = "public, max-age=604800"
EOF

printf 'node_modules\n.DS_Store\n*.log\n.netlify\n' > "$DEST/.gitignore"
echo "Packaged standalone studio at: $DEST"
echo "Next: create the empty repo verticaljetsales/benmcpeak-studio, then push $DEST to it."
