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
  [rpt-open]=report-view [rpt-preview]=report-preview [rpt-design]=report-design
)
for k in "${!SHOTS[@]}"; do
  node look.mjs "steps/$k.json" "shots/${SHOTS[$k]}.png" &
done
wait
# A user's view, signed in as one of the users from users.mjs
WA_USER=dokafor WA_PW='Viewer-Pass-2026!' node look.mjs steps/ux.json shots/user-view.png
node imgs.mjs
echo "Screenshots updated in public/img/"
