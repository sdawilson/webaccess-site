# Web Access Builder: name and logo

Decided by Simon on 8 November 2026, while building the marketing website. For any session working on the app (repo `sdawilson/webaccess`).

## Name

- The product is called **Web Access Builder**. "webaccess" stays as the repo and code name.
- Website: **https://webaccessbuilder.com** (webaccessbuilder.co.uk forwards to it). Contact: webaccessbuilder@gmail.com.
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
- Its screenshots come from a local copy of the app (`tools/screenshots/capture.sh` in the site repo). Re-take them when the app's look changes. Some still show an older highways sample; new ones use Fieldfare Traders (see "Leading with spreadsheets").
- The site never links to GitHub (Simon's choice).
- The public demo is at https://demo.webaccessbuilder.com: the Magic Containers app `webaccess-demo`, the same image with `DEMO_MODE=true`, showing the Fieldfare Traders sample. The site links to it from the hero, a "Try the demo" section, the FAQ and the notice on every page (`DEMO_URL` in `public/js/site.js`).
- Status, as Simon wants it stated everywhere: **in active development, not yet recommended for production use; we're inviting people to test it and give feedback.** The site shows this in a notice on every page, the request form is for a *test instance* and needs the tester to confirm they understand, and the FAQ says to test with copies of data. Worth echoing in the app (sign-in page or About) and the guides.

## Plans and the runtime, as the site states them

Decided by Simon on 9 November 2026, from the accounts, runtime and licensing proposal. The site leads with Access's original promise: **simple to build, free to hand out** (the hero says "Build it like Access. Hand it out free."; the runtime section, "Simple to build. Free to distribute.").

- Admins, the people who design, are paid seats: **£15 a month or £99 a year** each.
- The runtime is free for **up to 10 people per database** (Users and Guests together) while the database runs on SQLite. The proposal said 5; Simon changed it to 10.
- Users' and Guests' free access lasts while the account's Admin subscription is active. The site says "Their access stays free for as long as your subscription is active."
- More than 10 people on a database: "talk to us" (a hosted SQL database at a fee that covers its hosting).
- Databases are hosted in London. Customers are anyone, not only councils.
- Sharing, the runtime and the error log shipped on 9 Nov 2026, and the site describes them in the present tense. Paying isn't switched on, so the site still says these are planned prices and that testing is free; accounts are set up by hand through "request a test instance".
- The app has a rail and a command bar in place of a ribbon; the site never says "ribbon" about the app.

## The guides on the website

The site publishes the app's guides at `/guides/`, built at each deploy from `docs/` in `sdawilson/webaccess`. So for the session that writes the guides:

- **Please rename the product in the guides**: they still say "webaccess" (about 34 times, including the H1s). Use "Web Access Builder" in prose; "webaccess" is fine for the repo, code and file names.
- Keep these file names, as the site looks for them: `docs/user-guide.md`, `docs/programmers-guide.md`, `docs/access-differences.md`. A new guide needs adding to the list at the top of `tools/guides/build.mjs` in the site repo.
- Links between the guides (`user-guide.md#roles`) become site links automatically; keep using GitHub-style heading anchors.
- The site leaves out `docs/README.md`, `docs/CHANGELOG.md`, any link to GitHub, and any paragraph about the repo's workflows. Keep the guides about the product, not the repo.
- The site rebuilds daily at 05:17 UTC, so guide changes appear within a day (or at once if the site's deploy is run by hand).

## Mentioning Microsoft Access (10 Nov 2026)

Simon is reducing references to Access, in the app and on the site, to avoid legal trouble. On the site:

- Compare with Access; never say or imply the product is Access, or that a feature is "Access's own". Write "like Access's", "the ones Access uses", "you know from Access".
- No "Access" in the headline, page title or social title (other than in the product's name). Say "Microsoft Access" at the first mention in a section.
- Keep the trademark line in the footer and the "Is this Microsoft Access?" question.
- Tree View, List View, Image List and Progress Bar are the app's own controls (since 10 Nov 2026). Never call them ActiveX controls or Microsoft's; say they work like the Windows Common Controls, so code written for those runs.

## Leading with spreadsheets (11 Nov 2026)

Simon's view: Access developers are a small market, so the Spreadsheet control was added to bring in people who run things on shared Excel workbooks. The site leads on that, with Access as a second way in.

- Home page headline: "Spreadsheet and database, together at last.", with "Design it, then share it with your team as your own app." under it (Simon, 11 Nov: the best of both worlds; "hand it out free" sounded lightweight for a headline, so the free runtime is in the paragraph and the note under the buttons instead). It opens on the problem (a shared workbook that has become the system), then the Spreadsheet control, then the runtime.
- Two pages for where people come from: `/excel/` (what carries over, what's different, how to start) and `/access/` (what they'll recognise, what changes on the web, bringing a database across). The Access comparison lives on `/access/`, not the home page.
- Above the two cards on the home page: "What you rely on in Excel. What you always wanted from Access." (Simon's idea, softened from "Everything you needed from Excel, and everything you wanted in Access": no "everything", and not as the main headline.)
- A third, supporting message: everything in one place (database, forms, reports, code, sign-in, hosting), with no full-stack skills needed.
- Three ways to build, in this order: no code, macros, VBA.
- Don't say or imply it is Excel, or that it opens and runs Excel workbooks as they are. It imports and exports Excel files (formulas, formats, column widths); workbook VBA isn't imported, and conditional formats, validation, filters, charts and PivotTables don't come with a file. The `/excel/` page says so under "What's different".
- Same care with Microsoft's names as for Access: "Excel" is fine in comparisons and in "Coming from Excel"; the trademark line in the footer names both Microsoft Access and Microsoft Excel.
- Examples and screenshots use the Fieldfare Traders sample (a food wholesaler), never highways. Screenshots still showing the highways sample are to be retaken on Fieldfare.
- Claims with a source: 94% of business spreadsheets used for decisions contain errors (a 2024 review, linked to the phys.org report); VBA macros don't run in Excel for the web (Microsoft's Office Scripts and VBA comparison).
