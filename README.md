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
   - Optional email for each request: secret `RESEND_API_KEY`, variables `NOTIFY_TO` (your address) and `NOTIFY_FROM` (an address on a domain verified with [Resend](https://resend.com)). Without these, requests are still saved to storage.
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

## A custom domain

In the script's pull zone: Hostnames > Add, e.g. `webaccess.example.com`. Add a CNAME for it pointing at the `*.b-cdn.net` hostname, then turn on the free SSL certificate.

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
