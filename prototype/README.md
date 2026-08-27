# Screener UI Prototypes (Phase 1)

Interactive, dependency-free prototypes for the Screener UI/UX redesign.
Phase 1 compares two functionally equivalent directions before production UI
work begins. No protocol, routing, or product behavior is changed; all state
is simulated in the page.

- `b-visual/` — pure-visual direction ("客厅"), selected for production:
  glyphs, small SVG scenes, storyboards, and state motion carry guidance;
  copy lives in tooltips and aria labels.
- `a-text/` — text-first direction ("白纸黑字"), archived as the comparison
  direction and no longer being polished.
- `shared/strings.js` — one zh/en copy catalog used by both directions; the
  visual direction is the third presentation mode of the same keys.
- `shared/scenes.js` — URL-driven scene engine plus the bottom scene bar.
- `shared/feed.js` — fake game footage inside stages.
- `shots/` — captured key states (desktop and mobile); regenerate with
  `sh prototype/shots/capture.sh` while the local server is running.

## Preview

```sh
node prototype/serve.mjs        # http://localhost:4173/
```

Pages also open directly from the filesystem (no fetch calls).

## URL parameters

| Param | Effect |
| --- | --- |
| `?scene=NAME` | Initial scene (see the bottom bar for names per page) |
| `&mode=text` / `&mode=vis` | Language mode: zh/en text, or pure visual (default) |
| `&lang=en` / `&lang=zh` | Copy language for text modes and tooltips |
| `&theme=dark` / `&theme=light` | Theme (default: stored or system preference) |
| `&viewers=N` | Roster size (0-24; 20 shows the crowded couch) |
| `&chrome=0` | Hide the scene bar (used for screenshots) |
| `&details=1` / `&topology=1` / `&advanced=1` | Start with those panels expanded |
| `&relay=1` | Viewer relays to two downstream children |
| `&pawn=NAME` / `&metrics=1` | Pre-open a viewer detail row / its secondary metrics |
| `&policy=private` / `&password=1` | Host admission state |
| `&room=7316` / `&code=7316` | Room code shown / join dials prefilled |
