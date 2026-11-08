# Web Access Builder: name and logo

Decided by Simon on 8 November 2026, while building the marketing website. For any session working on the app (repo `sdawilson/webaccess`).

## Name

- The product is called **Web Access Builder**. "webaccess" stays as the repo and code name.
- Website: **https://webaccessbuilder.com** (webaccessbuilder.co.uk forwards to it). Contact: simonwilson@webaccessbuilder.co.uk.
- Copyright: © 2026 Simon Wilson. In public text: "Microsoft Access is a trademark of Microsoft Corporation. Web Access Builder is an independent product and isn't affiliated with or endorsed by Microsoft."
- The site's copy speaks as "we" (Simon plus friends who'll be involved).

## Logo

The mark is Access's "new record" button, ▶\*: a white triangle with an amber asterisk on a green rounded square. It stands for starting something new. The wordmark is "Web Access Builder" in Schibsted Grotesk ExtraBold (800), tracking −2%, drawn as outlines in the SVG files.

Colours:

| Use | Hex |
|---|---|
| Green: tile, title bar | `#1f4e3d` |
| Dark green | `#163a2d` |
| Ink: text | `#17241e` |
| Amber: asterisk on green | `#f2c94c` |
| Amber: asterisk on white | `#d9a514` |
| Workspace grey-green | `#eef2ef` |

Files (in this project, alongside this doc):

- `claude/brand/logo.svg`: mark and wordmark, dark text, for light backgrounds
- `claude/brand/logo-white.svg`: white tile and white text, for the green title bar
- The marks are below; save each as an `.svg` file.

Mark, for light backgrounds (also the favicon):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#1f4e3d"/><path d="M18 17.5v29l23-14.5z" fill="#ffffff" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round"/><path d="M47.50 25.70L47.50 13.30" stroke="#f2c94c" stroke-width="3.4" stroke-linecap="round"/><path d="M42.13 22.60L52.87 16.40" stroke="#f2c94c" stroke-width="3.4" stroke-linecap="round"/><path d="M42.13 16.40L52.87 22.60" stroke="#f2c94c" stroke-width="3.4" stroke-linecap="round"/></svg>
```

Mark, for the green title bar:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#ffffff"/><path d="M18 17.5v29l23-14.5z" fill="#1f4e3d" stroke="#1f4e3d" stroke-width="3.5" stroke-linejoin="round"/><path d="M47.50 25.70L47.50 13.30" stroke="#d9a514" stroke-width="3.4" stroke-linecap="round"/><path d="M42.13 22.60L52.87 16.40" stroke="#d9a514" stroke-width="3.4" stroke-linecap="round"/><path d="M42.13 16.40L52.87 22.60" stroke="#d9a514" stroke-width="3.4" stroke-linecap="round"/></svg>
```

## Suggested changes in the app

- Done (9657d3e): the logo and name in the title bar and sign-in page, and the mark as the favicon.
- Keep "Admin" and "User" badges and the green as they are: the site's colours were taken from the app.

## The marketing site

- Live at https://webaccessbuilder.com (DNS at Bunny); webaccessbuilder.co.uk forwards to it from names.co.uk, which keeps its DNS for email. Repo: `sdawilson/webaccess-site`.
- A static site served by a Bunny Edge Script from a Storage zone, deployed by GitHub Actions on every push, once a day, and by hand.
- Its screenshots come from a local copy of the app with a sample highways database (`tools/screenshots/capture.sh` in the site repo). Re-take them when the app's look changes.
- The site never links to GitHub (Simon's choice).
- Status, as Simon wants it stated everywhere: **in active development, not yet recommended for production use; we're inviting people to test it and give feedback.** The site shows this in a notice on every page, the request form is for a *test instance* and needs the tester to confirm they understand, and the FAQ says to test with copies of data. Worth echoing in the app (sign-in page or About) and the guides.

## The guides on the website

The site publishes the app's guides at `/guides/`, built at each deploy from `docs/` in `sdawilson/webaccess`. So for the session that writes the guides:

- **Please rename the product in the guides**: they still say "webaccess" (about 34 times, including the H1s). Use "Web Access Builder" in prose; "webaccess" is fine for the repo, code and file names.
- Keep these file names, as the site looks for them: `docs/user-guide.md`, `docs/programmers-guide.md`, `docs/access-differences.md`. A new guide needs adding to the list at the top of `tools/guides/build.mjs` in the site repo.
- Links between the guides (`user-guide.md#roles`) become site links automatically; keep using GitHub-style heading anchors.
- The site leaves out `docs/README.md`, `docs/CHANGELOG.md`, any link to GitHub, and any paragraph about the repo's workflows. Keep the guides about the product, not the repo.
- The site rebuilds daily at 05:17 UTC, so guide changes appear within a day (or at once if the site's deploy is run by hand).
