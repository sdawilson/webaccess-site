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
`pivottable`, `pivotchart`, `treeview`, `vba`, `share` and `runtime`. The AI assistant isn't in it: add a scene when
there is a real conversation to film.

After rendering: upload the MP4 to the Bunny Stream library, add the .vtt under Captions (English), and put the new
video's ID in `public/js/site.js` (`STREAM_VIDEO_ID`). The home page shows the video in a `<section id="tour">` with a
`.tour-frame` in it; that section was taken off the page on 11 Nov 2026 and goes back when the new video is uploaded.
