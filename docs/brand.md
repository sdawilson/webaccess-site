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

- The title bar shows "webaccess". Show the logo or "Web Access Builder" there instead, and on the sign-in page.
- Use the mark as the app's favicon.
- Keep "Admin" and "User" badges and the green as they are: the site's colours were taken from the app.

## The marketing site

A static site served by a Bunny Edge Script from a Storage zone, with a GitHub Actions deploy. Its screenshots come from a local copy of the app with a sample highways database. After the app's title bar changes, re-take them with `tools/screenshots/capture.sh` in the site repo, so the site matches the app.
