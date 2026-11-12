# A new website and a free plan: the plan

Written 12 November 2026. The website is built on a branch (see "Built on branch"); the app work is under way in another session. It follows a review of why the site had no test-instance requests in its first five days.

## Why change

- **Few people have seen the site.** Bunny shows 15,144 requests and 273 MB this month, which is at most about 250 home page views, many of them Simon's and Claude's own checks. Real visitors are probably in the tens.
- **The site isn't findable.** A search for the domain returned none of its pages, and the name "Web Access Builder" brings up web accessibility tools and website builders.
- **Visitors are sent to the demo, which captures nothing.** The demo needs no sign-up, so interest leaves no trace.
- **The form asks a lot for a weak offer.** It is 20,000 pixels down the page, has nine fields and a required "not for production" tick box, and is framed as "Help us test it".
- **The first thing a visitor reads is a warning.**

## Decisions (Simon, 12 Nov)

1. **A free plan that people sign up for** replaces "request a test instance". People build for free and pay when they want to use it for real, as Xojo does.
2. **No sharing on the free plan.** Preview as User already shows what a User would see. Sharing a database with Users or Guests needs a licence.
3. **Keep the no-sign-up demo.**
4. **One sign-in at a time** for a free Admin, so a password isn't shared.
5. **The sample database is included** in a free account, as a reference.
6. **Drop the warning**, now the outstanding features are built and tested.
7. **No caps on tables, queries, forms or reports** on the free plan.
8. **Free plan size: 5,000 records and 10 MB.** The assistant gets $1 a month.
9. **A free account is deleted automatically after 180 days of no use.**
10. **Sign-up emails a verification code**, and the account isn't usable until the code is entered.

## The free plan (settled 12 Nov)

| | Free | Builder (£15 a month or £99 a year, per Admin) |
|---|---|---|
| Databases | 1 of your own, plus the Fieldfare Traders sample | Up to 20; contact us for more |
| Size | 5,000 records across the database (the sample not counted) and 10 MB including attachments | 50 MB for each database; contact us for more |
| Tables, queries, forms, reports, code | Unlimited | Unlimited |
| Sharing | None. Preview as User only | Up to 10 people use each database free, in the runtime |
| Sign-in | One session at a time | No limit |
| AI assistant | $1 a month | $2 a month |
| Kept for | Deleted after 180 days of no use | While subscribed |
| Backups | Download a copy any time | Nightly backups as well |
| Import and export (Excel, Access, CSV) | Yes | Yes |

Notes on the limits:

- **5,000 records and 10 MB**: the 5,000 is counted across the whole database, not per table, and the sample doesn't count. Attachments count towards the 10 MB. (Simon, 12 Nov.)
- **180 days of no use**: "use" should mean the Admin signing in. Suggest an email 30 days and 7 days before deletion, with a link to sign in or download the database, and say so in the privacy policy. An account that has upgraded and then lapsed should be treated as free from the day it lapses.
- **The verification code**: six digits, emailed, valid for a short time (suggest 15 minutes), with a limit on attempts and on resends. Brevo is already set up on the domain for sending. Password reset should use the same kind of code.
- **One session at a time** should work by ending the older session when a new one starts, not by refusing the new sign-in, or someone who closes a laptop is locked out.
- **The assistant costs money per use**, so a free account needs its own allowance. The per-account switch and monthly limit already exist.
- **What happens at a limit** should be a clear message with an Upgrade button, never lost work.

## The warning

- Remove the yellow banner from every page and the tick box from the form.
- Don't replace it with a claim that it is production ready: no outside user has tried it yet, and the assistant has not run against a real model.
- Use a small "Early access" label by the logo or the plans, and say plainly that a database can be downloaded at any time.

## What the app needs first

The website can't lead with "Start free" until these exist:

1. Self-serve sign-up: email and password, then a verification code sent by email that must be entered before the account can be used. Password reset by emailed code.
2. Plans in the app: the free limits above, enforced, with messages at each limit.
3. One session at a time for a free Admin.
4. Sharing switched off on the free plan, with Preview as User left on.
5. The sample database added to a new free account.
6. An upgrade path with payment, and what happens when a subscription lapses (suggest: sharing stops, the database stays and can be downloaded).
7. In the demo, a "Keep this: create a free account" prompt.
8. Limits against abuse: sign-ups per address, and a way to suspend an account.
11. Automatic deletion of a free account after 180 days of no use, with warning emails first.
9. Terms of use and a privacy policy, covering whose data it is, where it is held and how to delete it. These need proper legal review.
10. Counts for the admin page: sign-ups, verified sign-ups, databases created, upgrades.

## The new website

**One goal:** create a free account. Everything else supports that or moves to its own page.

### Home page (short: about a fifth of today's length)

1. **Top.** Headline "Spreadsheet and database, together at last." with "Design it, then share it with your team as your own app." A picture or short loop of the Stock Workbook visible on the first screen, on a phone too. Primary button **Start free**, secondary **Try the demo, no sign-up**. One line under the buttons: "Free to build. £15 a month when you share it with your team."
2. **Three proof blocks**, each a picture and three lines:
   - A workbook on live data: change a cell and the record is saved for everyone.
   - Forms, reports and pivots on the same data, built with no code, macros or VBA.
   - Share it as your own app: your team gets the forms and reports, not the design tools.
3. **The video** (1:50).
4. **The assistant**, in brief, with the same cautious wording as now.
5. **Free against Builder**: the table above, with Start free under Free.
6. **Where you're coming from**: the two cards, "What you rely on in Excel. What you always wanted from Access."
7. **Who is behind it**: a rewritten note from Simon for both audiences, without the coffee request, plus where data is held, backups and a contact route.
8. **Five questions**: Is it Excel? Can I open my workbook? What does the free plan include? What happens to my data if I stop? What does the assistant see?
9. **Sign-up**, in the page: email and password, then the emailed verification code.

### Other pages

- **/features/**: today's Data, Forms, Reports, Pivot and Code sections, moved off the home page.
- **/excel/** and **/access/**: as now, ending with Start free.
- **/pricing/**: the plans in full, with the questions about limits, upgrading and cancelling.
- **/screenshots/** and **/guides/**: as now.
- **/terms/** and **/privacy/**: new.

### Menu

Features, From Excel, From Access, Pricing, Guides, and a **Start free** button. Five items instead of nine.

### Wording to change everywhere

- "Request a test instance" and "Help us test it" become "Start free".
- "Free while we test" becomes "Free to build".
- Remove "not yet recommended for production use" and the tick box.
- The suggestion form stays.

### Counting

On Simon's admin page, per day and with crawlers left out: page views, demo starts, Start free clicks and sign-ups. No cookies, and nothing stored about individual visitors.

## Getting people to it

The site changes won't show a result until more people arrive.

1. Submit the sitemap in Google Search Console and Bing Webmaster Tools, and check what gets indexed.
2. Post where Excel and Access people gather: Excel and Access forums and subreddits, LinkedIn, a "Show HN".
3. Send it to people Simon already knows who run things on shared workbooks.
4. Write two or three pages that answer what people search for, such as "share an Excel workbook with a database behind it" and "Access on the web".
5. The name is a handicap in search and says little to an Excel user. Changing it is a large decision and is not part of this plan, but it is worth weighing before any paid promotion.

## Order of work

1. The free plan's numbers are settled (above).
2. App: sign-up, plans and limits, one session, the upgrade path, the demo prompt, the counts.
3. Terms and privacy policy.
4. Site: the new home page and pages, built on a branch and shown to Simon before it goes live.
5. Launch both together, then start telling people.

Meanwhile, three things can be done on today's site without waiting: remove the warning banner, add the visit counter, and move a shortened form higher up the page.

## Built on branch `free-plan` (12 Nov, not live)

The redesigned site is on branch `free-plan` of `sdawilson/webaccess-site`. It must not be merged to `main` until the app's sign-up is live.

**Pages:** `/` (short), `/features/`, `/vba/` (new angle: Visual Basic in a web browser), `/pricing/` (plans, comparison, questions, contact form), `/excel/`, `/access/`, `/screenshots/`, guides. Menu: Features, Visual Basic, From Excel, From Access, Pricing, Guides, Start free.

**Counting is built:** the edge script takes `POST /api/hit` (view, demo, signup) and the admin page shows a Visits panel. It starts counting when the branch is deployed. Sign-ups themselves have to be counted by the app.

**The phrases, and where they come from:**

| Phrase used on the site | Source |
|---|---|
| Access 2013 removed PivotTable and PivotChart views | Microsoft, "Discontinued features and modified functionality in Access 2013" |
| Access web apps were shut down in 2018 | Microsoft, Access Services in SharePoint roadmap |
| VBA macros don't run in Excel for the web; its scripts are TypeScript | Microsoft Learn, Office Scripts and VBA differences |
| VBA will stay but won't be developed further | Microsoft's Excel team, as reported by No Longer Set |
| Everyone has their own copy; no relationships; weak validation; no permissions for part of a sheet; 1,048,576 rows | General, and m365.fm "Why Excel is not your database" |

Not used on the site: the "94% of spreadsheets have errors" figure (it is about formula errors, not about using a workbook as a database).

Approved by Simon on 12 Nov: the founder's note, the "Early access" label and naming Anthropic's Claude.

**Waiting on Simon:**

- The sign-up address is `https://app.webaccessbuilder.com/signup` (agreed 12 Nov) (one constant, `SIGNUP_URL`, in `public/js/site.js`, plus the `href`s).
- Builder plan (Simon, 12 Nov): up to 20 databases, 50 MB for each database, with "contact us" for more. The site also says "no limit on records"; that is not confirmed. The assistant gets $2 a month on Builder (Simon, 12 Nov), shown on the site as "twice the free plan's allowance".
- Also settled 12 Nov: "no use" means no Admin has signed in; sign-up must carry a tick box confirming business use (for the app); the email and postal address may appear on the terms and privacy pages.
- Terms and privacy (Simon, 12 Nov): the provider is Simon in his own name; the service is for business users only; the contact address is webaccessbuilder@gmail.com.
- Terms and privacy are drafted (`terms-draft.md`, `privacy-draft.md`) and need legal review before they become `/terms/` and `/privacy/`.

**Housekeeping:** `tools/site/newsite.py` generated the pages from `main` and is kept for reference only. The pages are now edited by hand; re-running it would undo later fixes.

## Still open

- Which payment service, and what happens when a subscription lapses.
- Who reviews the terms and privacy policy.
