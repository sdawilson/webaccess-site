# Keeping the website in step with the app

A scheduled task checks this every day. This file is its checklist; a person can follow it too.

The app is `sdawilson/webaccess` (public). The website is this repo, `sdawilson/webaccess-site`, served at https://webaccessbuilder.com and deployed by GitHub Actions on every push to `main`.

`.app-sync.json` records the last app commit the website was checked against. Simon approves every change: the check opens (or updates) a pull request and never pushes to `main` itself.

## 1. What changed in the app?

- Fetch the app's `main` and list the commits since `.app-sync.json`'s `appCommit`. Ignore commits whose message contains `[skip docs]`: those only update the app's guides, which the website already rebuilds daily by itself.
- If nothing else is new, stop: no branch, no pull request.
- Otherwise read the commit messages, the app's `README.md` (it lists every feature and the roadmap), and the diff of `README.md` since `appCommit`. The README is the source of truth; don't describe anything it doesn't.

## 2. Check every claim on the website

Compare the app's current README with what the site says, and note each thing that is now wrong, missing or out of date:

| Where | File | What to check |
|---|---|---|
| Hero, meta description | `public/index.html` | The feature list ("tables, queries, forms, reports and VBA") |
| "If you've built in Access…" table | `public/index.html` | Each row still true; a new Access feature worth a row? |
| Tables and queries, Forms, Reports, PivotTable, VBA sections | `public/index.html` | The ticked bullets, and whether a new feature belongs in one |
| "What changes when it's on the web" and "a few things Access never had" | `public/index.html` | Still true; anything new that Access never had |
| "Bring your database across" steps | `public/index.html` | What Import from Access brings in (it grows over time) |
| "Still to come" | `public/index.html` | Remove what's now done; add what the README's roadmap says is next |
| Questions | `public/index.html` | Especially "Can I open my .accdb", "Will my VBA run?", "Does it do reports?" |
| Screen gallery captions | `public/js/site.js` (`SCREENS`) | Captions and alt text still describe the screens |

Keep the site's voice: plain British English, "we", short sentences, no hype, nothing the app doesn't do yet. Keep the development notice and the "not for production" wording exactly as they are unless Simon has changed them.

## 3. Screenshots, if the app's screens changed

If the new commits touched the app's `public/` folder (its browser code), retake the screenshots so they match:

1. Clone the app next to this repo, `npm install`, and start it with a throwaway admin on port 3100 (see `tools/screenshots/README.md`; use a fresh `DATA_DIR`).
2. In `tools/screenshots/`: make sure `playwright` and `sharp` can be imported (`npm i playwright sharp` if not), then run `seed.mjs`, `seed2.mjs`, `seed3.mjs` and `users.mjs` with `SEED_PW`, then `WEBACCESS_DIR=<app clone> ./capture.sh`.
3. Look at every new image. If a step no longer finds what it clicks (a renamed button, say), fix that step's JSON in `tools/screenshots/steps/` and retake. Don't commit a screenshot that shows an error, a half-loaded screen or the wrong thing.
4. If a notable new feature has a screen of its own, consider adding a shot: a step file, an entry in `capture.sh` and `imgs.mjs`, a caption in `SCREENS`, and possibly a view tab in the matching section.

## 4. Check the result

- The page still loads with no console errors: serve `public/` (`node devserver.mjs`, port 4100) and open it in Playwright at 1440×900 and 390×844. No sideways scrolling on the phone.
- Every image the page references exists in `public/img/`.
- The view tabs and the gallery still switch screens.

## 5. Propose the changes

- Work on the branch `app-sync`. If a pull request from `app-sync` is already open (Simon hasn't merged the last one yet), add to it rather than opening another.
- Set `.app-sync.json`'s `appCommit` to the app commit you checked against, and `checkedAt` to now.
- Commit, push the branch, and open or update the pull request with GitHub's REST API (`gh api repos/sdawilson/webaccess-site/pulls ...`; GraphQL isn't available).
- The pull request description says, in plain words: which app versions were checked, what on the site was out of date and how it was changed, which screenshots were retaken, and anything you were unsure of under "To check". Simon reads this to decide whether to merge.

## Never

- Push to `main`, merge the pull request, or change the Bunny settings.
- Add a link to GitHub on the website (Simon's choice), or claim the app is ready for production.
