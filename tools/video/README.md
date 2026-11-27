# Demo video

Makes the narrated demo of Web Access Builder (about 1 minute 50) from a local copy of the app.

1. Have the app's code next to this repo (`../webaccess`, or set `WEBACCESS_DIR`), with `npm install` run in it.
   Here, `npm i playwright sharp` (or link `../screenshots/node_modules`), with Chromium for Playwright and ffmpeg on the PATH.
2. `node film.mjs <take-folder>` starts a fresh demo-mode copy of the app on port 3200, drives it, and records each
   scene's keyframes: a JPEG per state (`keys/`) and `plan.json` (how long each is shown and where the cursor moves).
   Add a scene's name to film just that one while adjusting it; `node sheet.mjs <take> <scene> out.jpg` makes a contact sheet.
3. `node render.mjs <take-folder>` draws the cursor, click rings and caption band on 30 fps frames, encodes one MP4 per
   scene plus the title and end cards, joins them, lays the narration under it and writes
   `out/web-access-builder-demo.mp4` and `out/web-access-builder-demo.en.vtt` (captions).

The narration is in `narration.json`, one line per scene, and its recordings in `vo/` (ElevenLabs, the voice "Adam",
model eleven_v4). Each scene is held until its line has finished, so a longer line needs no re-timing. To change a
line, re-generate that one clip, replace its file and render again; nothing needs re-filming.

The film is all on the Fieldfare Traders sample that the demo-mode app builds for itself (no highways examples), and
needs `npm run build:univer` run in the app's folder for the spreadsheet scene. It opens with the Stock Workbook: a
stock level is changed in a cell, and the Products form shows the saved record. The scenes are `sheet`, `forms`,
`queries`, `reports`, `pivottable`, `pivotchart`, `treeview`, `vba`, `assistant`, `share` and `runtime`.

The `assistant` scene isn't filmed by film.mjs, because the local copy has no API key. It was filmed by hand in
Chrome on the live app on 16 Nov 2026 (a real conversation: "Make a form to enter suppliers, with their products
listed beneath"). Its frames are kept in `assistant-frames/`; copy them to `<take>/ai-raw/` (cropped to the app, 1440 x 762 in shape) and
`assistant-scene.json` holds its timing and cursor; add it to a take with
`node add-scene.mjs <take> assistant-scene.json share` before rendering.

The queries scene opens a saved query, Products to Reorder, rather than building one, because double-clicking a
field whose name has a space in it adds it without brackets and the query then fails (reported 16 Nov 2026).

After rendering: upload the MP4 to the Bunny Stream library, add the .vtt under Captions (English), and put the new
video's ID in `public/js/site.js` (`STREAM_VIDEO_ID`). The home page shows the video in a `<section id="tour">` with a
`.tour-frame` in it; that section was taken off the page on 11 Nov 2026 and goes back when the new video is uploaded.

## The code video

A second, shorter video (about 1:40) on the languages: modern VBA (constructors, Try and Catch, $"…" strings,
inline functions), the libraries in References, a Python module called from VBA, an event written in Python
and one in JavaScript on the Restock form (`setupEvents` in `../screenshots/features-setup.mjs`), a Matplotlib
chart on a form, and JavaScript with the Fuse library. Refilmed 27 Nov 2026 on the app's staging build `eb75b97`
(take-code3); the tour was re-rendered from take7 the same day with new `runtime` and `end` lines and end card.

    node film-code.mjs take-code          # films it; code-setup.mjs adds the modules, form and References
    node render.mjs take-code code        # out/web-access-builder-code.mp4 and .en.vtt

Its narration is `code/narration.json`, recorded into `code/vo/` (same voice and model as the tour). The local
app needs `npm run build:python` as well as `build:univer`. `code-setup.mjs` is also used by the screenshot
script's `languages` group, so the pictures on /vba/ and /python/ match the video.
