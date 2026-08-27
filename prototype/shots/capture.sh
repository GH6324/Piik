#!/bin/sh
# Regenerate prototype screenshots with headless Chrome.
# Usage: sh prototype/shots/capture.sh [base-url]
set -u
BASE="${1:-http://localhost:4173}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
OUT="$(cd "$(dirname "$0")" && pwd -W)"

shot() {
  # $1 file, $2 url, $3 window-size
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size="$3" --virtual-time-budget=2500 \
    --screenshot="$OUT\\$1" "$2" >/dev/null 2>&1 \
    && echo "ok  $1" || echo "ERR $1"
}

# --- Direction A (text) desktop ---
shot a-host-idle.png    "$BASE/a-text/host.html?scene=idle&chrome=0&theme=light"    1440,900
shot a-host-live.png    "$BASE/a-text/host.html?scene=live&viewers=4&details=1&chrome=0&theme=light" 1440,900
shot a-host-paused.png  "$BASE/a-text/host.html?scene=paused&viewers=3&chrome=0&theme=light" 1440,900
shot a-viewer-playing.png "$BASE/a-text/viewer.html?scene=playing&details=1&chrome=0&theme=light" 1440,900
shot a-viewer-waiting.png "$BASE/a-text/viewer.html?scene=waiting&chrome=0&theme=light" 1440,900
shot a-join.png         "$BASE/a-text/join.html?scene=form&chrome=0&theme=light"    1440,900
shot a-host-advanced.png "$BASE/a-text/host.html?scene=ended&advanced=1&policy=private&password=1&details=1&topology=1&chrome=0&theme=light" 1440,1100

# --- Direction A mobile (via fixed-width frame) ---
shot a-host-live-m.png    "$BASE/frame.html?src=a-text/host.html%3Fscene%3Dlive%26viewers%3D3%26chrome%3D0%26theme%3Dlight" 430,932
shot a-viewer-playing-m.png "$BASE/frame.html?src=a-text/viewer.html%3Fscene%3Dplaying%26chrome%3D0%26theme%3Dlight" 430,932
shot a-join-m.png         "$BASE/frame.html?src=a-text/join.html%3Fscene%3Dform%26chrome%3D0%26theme%3Dlight" 430,932

# --- Direction B (visual) desktop ---
shot b-host-idle.png    "$BASE/b-visual/host.html?scene=idle&chrome=0&theme=light"    1440,900
shot b-host-live.png    "$BASE/b-visual/host.html?scene=live&viewers=4&details=1&chrome=0&theme=light" 1440,900
shot b-host-starting.png "$BASE/b-visual/host.html?scene=starting&chrome=0&theme=light" 1440,900
shot b-viewer-playing.png "$BASE/b-visual/viewer.html?scene=playing&details=1&chrome=0&theme=light" 1440,900
shot b-viewer-needsplay.png "$BASE/b-visual/viewer.html?scene=needsplay&chrome=0&theme=light" 1440,900
shot b-viewer-waiting.png "$BASE/b-visual/viewer.html?scene=waiting&chrome=0&theme=light" 1440,900
shot b-join.png         "$BASE/b-visual/join.html?scene=form&chrome=0&theme=light"    1440,900
shot b-host-advanced.png "$BASE/b-visual/host.html?scene=live&viewers=4&advanced=1&topology=1&policy=private&password=1&chrome=0&theme=light" 1440,1200
shot b-host-topology.png "$BASE/b-visual/host.html?scene=live&viewers=4&details=1&topology=1&chrome=0&theme=light" 1440,1000
shot b-viewer-relay.png "$BASE/b-visual/viewer.html?scene=playing&details=1&topology=1&relay=1&chrome=0&theme=light" 1440,1250

# --- Direction B text modes and dark theme ---
shot b-host-live-zh.png   "$BASE/b-visual/host.html?scene=live&viewers=4&mode=text&lang=zh&chrome=0&theme=light" 1440,900
shot b-host-live-en.png   "$BASE/b-visual/host.html?scene=live&viewers=4&mode=text&lang=en&chrome=0&theme=light" 1440,900
shot b-viewer-playing-zh.png "$BASE/b-visual/viewer.html?scene=playing&mode=text&lang=zh&chrome=0&theme=light" 1440,900
shot b-join-zh.png        "$BASE/b-visual/join.html?scene=form&mode=text&lang=zh&chrome=0&theme=light" 1440,900
shot b-host-live-dark.png "$BASE/b-visual/host.html?scene=live&viewers=4&theme=dark&chrome=0" 1440,900
shot b-viewer-playing-dark.png "$BASE/b-visual/viewer.html?scene=playing&theme=dark&chrome=0" 1440,900
shot b-join-dark.png      "$BASE/b-visual/join.html?scene=form&theme=dark&chrome=0" 1440,900

# --- Direction B large roster (20 viewers) ---
shot b-host-crowded.png   "$BASE/b-visual/host.html?scene=live&viewers=20&chrome=0&theme=light" 1440,900
shot b-host-crowded-zh.png "$BASE/b-visual/host.html?scene=live&viewers=20&mode=text&lang=zh&chrome=0&theme=light" 1440,900
shot b-viewer-crowded.png "$BASE/b-visual/viewer.html?scene=playing&viewers=19&chrome=0&theme=light" 1440,900
shot b-host-pawn.png      "$BASE/b-visual/host.html?scene=live&viewers=4&pawn=%E8%98%91%E8%8F%87&mode=text&lang=zh&chrome=0&theme=light" 1440,900
shot b-host-pawn-full.png "$BASE/b-visual/host.html?scene=live&viewers=4&pawn=%E8%98%91%E8%8F%87&metrics=1&mode=text&lang=zh&chrome=0&theme=light" 1440,1050
shot b-host-tree.png      "$BASE/b-visual/host.html?scene=live&viewers=6&topology=1&mode=text&lang=zh&chrome=0&theme=light" 1440,1900
shot b-viewer-tree.png    "$BASE/b-visual/viewer.html?scene=playing&viewers=5&topology=1&relay=1&mode=text&lang=zh&chrome=0&theme=light" 1440,1900

# --- Direction B mobile ---
shot b-host-live-m.png    "$BASE/frame.html?src=b-visual/host.html%3Fscene%3Dlive%26viewers%3D3%26chrome%3D0%26theme%3Dlight" 430,932
shot b-viewer-playing-m.png "$BASE/frame.html?src=b-visual/viewer.html%3Fscene%3Dplaying%26chrome%3D0%26theme%3Dlight" 430,932
shot b-join-m.png         "$BASE/frame.html?src=b-visual/join.html%3Fscene%3Dform%26chrome%3D0%26theme%3Dlight" 430,932
