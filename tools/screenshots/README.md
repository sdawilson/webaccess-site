# Screenshots

Every screenshot on the site comes from a local copy of webaccess in demo mode, which builds the Fieldfare Traders sample database itself (a food wholesaler: orders, stock and sales). Re-take them after webaccess's look changes. There are no highways examples: Simon asked for none.

1. Clone and start webaccess next to this repo, in demo mode, with a throwaway admin:

   ```sh
   git clone https://github.com/sdawilson/webaccess ../webaccess
   cd ../webaccess && npm install && npm run build:univer   # build:univer is the Spreadsheet control's workbook
   DATA_DIR=/tmp/wa-shots PORT=3200 DEMO_MODE=true ADMIN_USER=admin ADMIN_PASSWORD='Shot-Capture-2026!' \
     PUBLIC_URL=https://app.webaccessbuilder.com ANTHROPIC_API_KEY=test-key AI_API_URL=http://localhost:3220/v1/messages \
     node server/index.js
   ```

   Start from an empty `DATA_DIR` each time, so the sample is the current one.

2. In another terminal, from this folder:

   ```sh
   npm i playwright sharp
   WEBACCESS_DIR=../../../webaccess ./capture.sh          # everything
   WEBACCESS_DIR=../../../webaccess ./capture.sh forms    # or only some groups
   ```

`shoot.mjs` signs in as the admin and takes the screens one at a time, in groups: `forms`, `pivots`, `queries`, `code`, `reports`, `misc` (macro, relationships, Options, users, sharing, Help, the Access import), `sheet` (the Stock Workbook), `assistant`, `runtime` (signed in as a User) and `demo` (as a demo visitor). It adds a few people and one macro to the sample. `capture.sh` saves 2× PNGs to `shots/`, and `imgs.mjs` writes WebP versions, full and cropped, to `public/img/`.

Then look at every picture before publishing: `node sheet-of.mjs shots /tmp/sheet.jpg form-view pivottable …` makes a contact sheet.

Two things to know:

- **The assistant's screens use a stand-in for the AI service.** `shoot.mjs` runs a small server on port 3220 that answers with a script (the plan in the picture is written in `shoot.mjs`, not by a model), and the app is started with `AI_API_URL` pointing at it. Retake `assistant` from a real conversation when there is one worth showing.
- **The Stock Workbook's note** beside its buttons is two lines in a one-line label in the sample; `shoot.mjs` makes the label taller before the shot.

The data and passwords here are made up and only ever used on a local, temporary instance.
