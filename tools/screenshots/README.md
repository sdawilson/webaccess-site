# Screenshots

The site's screenshots come from a local copy of webaccess with a small sample database of highway schemes and defects. Re-take them after webaccess's look changes.

1. Clone and start webaccess next to this repo, with a throwaway admin:

   ```sh
   git clone https://github.com/sdawilson/webaccess ../webaccess
   cd ../webaccess && npm install
   DATA_DIR=/tmp/wa-shots PORT=3100 ADMIN_USER=admin ADMIN_PASSWORD='Shot-Capture-2026!' node server/index.js
   ```

2. In another terminal, from this folder, add the sample data, then take the shots:

   ```sh
   npm i playwright sharp
   SEED_PW='Shot-Capture-2026!' node seed.mjs    # tables and records
   SEED_PW='Shot-Capture-2026!' node seed2.mjs   # queries, forms and code
   SEED_PW='Shot-Capture-2026!' node seed3.mjs   # a grouped report
   SEED_PW='Shot-Capture-2026!' node seed4.mjs   # calculated fields, a chart dashboard
   SEED_PW='Shot-Capture-2026!' node users.mjs   # a few admins and users
   WEBACCESS_DIR=../../../webaccess DEMO_URL=http://localhost:3200 ./capture.sh
   ```

`capture.sh` saves 2× PNGs to `shots/` and writes WebP versions, full and cropped, to `public/img/`. Each `steps/*.json` file lists the clicks for one screen.

The data and passwords here are made up and only ever used on a local, temporary instance.

The demo's screens come from a second copy of the app in demo mode: in the app folder, `DATA_DIR=/tmp/wa-demo PORT=3200 DEMO_MODE=true ADMIN_PASSWORD='Shot-Capture-2026!' node server/index.js`. It builds the Fieldfare Traders sample database itself. If it isn't running, `capture.sh` keeps the published demo screenshots.
