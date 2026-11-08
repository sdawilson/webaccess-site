# webaccess-site

The marketing website for [webaccess](https://github.com/sdawilson/webaccess), hosted on bunny.net.

- `public/` is the site: plain HTML, CSS and JavaScript, no build step. Screenshots are in `public/img/`.
- `edge/script.ts` is a Bunny **standalone Edge Script**. It serves the site's files from a Bunny **Storage zone** and saves the "Request a hosted instance" form to the same zone.
- `.github/workflows/deploy.yml` deploys on every push to `main`.
- `tools/screenshots/` re-takes the screenshots from a local webaccess with a sample highways database.

## How it fits together

```
browser ──▶ Bunny CDN (the edge script's pull zone)
               │ cache miss
               ▼
            edge/script.ts ──▶ Storage zone
               GET  /…            reads  site/…
               POST /api/request  writes requests/YYYY/MM/<id>.json  (+ optional email via Resend)
```

The script is the origin for its pull zone, so the CDN caches the files it returns: HTML for 5 minutes, CSS and JS for an hour, images for a day. Each deploy purges the cache. Only files under `site/` can ever be served, so saved requests stay private.

## One-time setup on bunny.net

1. **Storage zone.** Storage > Add Storage Zone, name it `webaccess-site`, tier Standard. Pick the main region (e.g. London). Note its **storage hostname** under FTP & API Access (`storage.bunnycdn.com` for Falkenstein, `uk.storage.bunnycdn.com` for London, and so on) and its **password**.
2. **Edge script.** Edge Platform > Scripting > Add Script > **Standalone**, name it `webaccess-site`. Bunny creates a pull zone for it with a `*.b-cdn.net` hostname.
   - Env Configuration, variables: `STORAGE_ZONE` = `webaccess-site`, `STORAGE_HOST` = the storage hostname.
   - Env Configuration, secrets: `STORAGE_KEY` = the storage zone password.
   - Optional email for each request: secret `RESEND_API_KEY`, variables `NOTIFY_TO` = `simonwilson@webaccessbuilder.co.uk` and `NOTIFY_FROM` = e.g. `requests@webaccessbuilder.com` (verify webaccessbuilder.com with [Resend](https://resend.com) by adding its DNS records in Bunny DNS). Without these, requests are still saved to storage.
   - Deployments > Settings: note the **script ID** and **deploy key**.
3. **Pull zone ID.** CDN > the pull zone named after the script: the ID is in its URL and General settings.
4. **API key.** Account settings > API key, for purging the cache.

## One-time setup on GitHub

Settings > Secrets and variables > Actions:

| Kind | Name | Value |
|---|---|---|
| Variable | `STORAGE_ZONE` | `webaccess-site` |
| Variable | `STORAGE_HOST` | the storage hostname |
| Variable | `PULLZONE_ID` | the script's pull zone ID |
| Secret | `STORAGE_KEY` | the storage zone password |
| Secret | `SCRIPT_ID` | the edge script ID |
| Secret | `DEPLOY_KEY` | the edge script deploy key |
| Secret | `BUNNY_API_KEY` | the account API key |

Then push to `main`, or run the workflow from the Actions tab. Until `STORAGE_ZONE` is set the workflow skips itself.

## The domains

Both are registered at names.co.uk. **webaccessbuilder.com** is the site's address; **webaccessbuilder.co.uk** carries email (simonwilson@webaccessbuilder.co.uk) and forwards visitors to the .com.

**webaccessbuilder.com** (no email on it, so its DNS can move to Bunny):

1. Bunny: DNS > Add Zone > `webaccessbuilder.com`.
2. names.co.uk: set the .com's nameservers to the two Bunny shows (e.g. `kiki.bunny.net`, `coco.bunny.net`).
3. Bunny: the script's pull zone > Hostnames > add `webaccessbuilder.com` and `www.webaccessbuilder.com`. In the DNS zone, point both at the pull zone (Bunny offers this as a "Pull Zone" record), then turn on the free SSL certificate for each.

**webaccessbuilder.co.uk** (leave its nameservers at names.co.uk, or the mailbox stops working):

- names.co.uk: set up web forwarding from `webaccessbuilder.co.uk` and `www.webaccessbuilder.co.uk` to `https://webaccessbuilder.com`. Don't touch its MX records.
- If its DNS ever moves to Bunny, copy every MX, SPF (TXT), DKIM and autodiscover record from names.co.uk first.

## Reading requests

Storage > `webaccess-site` > File Manager > `requests/`. Each request is a JSON file named by date and time.

## Adding the demo video (Bunny Stream)

Upload the video to a Bunny Stream library, then set `STREAM_LIBRARY_ID` and `STREAM_VIDEO_ID` at the top of `public/js/site.js`. The "Watch it in use" section appears once both are set.

## Previewing locally

```sh
node devserver.mjs        # http://localhost:4100, with a stand-in for POST /api/request
```

## Re-taking the screenshots

See `tools/screenshots/README.md`.
