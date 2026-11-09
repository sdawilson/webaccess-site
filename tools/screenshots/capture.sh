#!/usr/bin/env bash
# Re-takes every screenshot from a local webaccess seeded with the sample highways database.
# See README.md in this folder. Needs Node 22 and Playwright (npm i playwright sharp).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p shots
export DSF=2
declare -A SHOTS=(
  [s1]=continuous-form [s2]=form-view [s3]=form-design [prop]=property-sheet [p1]=pivottable [p2]=pivotchart
  [q1]=query-totals [q2]=query-criteria [sql]=sql-view [tbl]=table-design [ds]=datasheet [m2]=form-code
  [dbg]=debugger [ac]=intellisense [cf]=conditional-formatting [imp]=import-access [usr]=users
  [rpt-open]=report-view [rpt-preview]=report-preview [rpt-design]=report-design [dash]=chart-dashboard [explorer]=treeview-listview [help]=help-guides [share]=share
)
for k in "${!SHOTS[@]}"; do
  node look.mjs "steps/$k.json" "shots/${SHOTS[$k]}.png" &
done
wait
# A user's view, signed in as one of the users from users.mjs
WA_USER=dokafor WA_PW='Viewer-Pass-2026!' node look.mjs steps/ux.json shots/user-view.png
cp shots/user-view.png shots/runtime-view.png   # the same window, uncropped, for the runtime section
# The demo's screens, from a second copy of the app in demo mode (skipped if it isn't running)
if curl -sf "${DEMO_URL:-http://localhost:3200}/api/demo/info" | grep -q '"enabled":true'; then
  OUT=shots node demo.mjs
else
  echo "No demo instance at ${DEMO_URL:-http://localhost:3200}: keeping the demo screenshots already in public/img/"
fi
node imgs.mjs
echo "Screenshots updated in public/img/"
