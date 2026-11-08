// webaccess marketing site: Bunny Edge Script (standalone).
//
// GET  /...           serves the site's files from the storage zone, under site/
// POST /api/request   saves a "request an instance" form to the storage zone, under requests/,
//                     and emails a notification if RESEND_API_KEY is set
// POST /api/feature   saves a "suggest a feature" form to the storage zone, under features/,
//                     and emails a notification in the same way
//
// The script is the origin for its pull zone, so the CDN caches the files it serves
// (see Cache-Control below) and the script runs only on a cache miss.
//
// Environment variables (Edge Script > Env Configuration):
//   STORAGE_ZONE     storage zone name, e.g. webaccess-site
//   STORAGE_HOST     storage endpoint for the zone's main region (default storage.bunnycdn.com;
//                    e.g. uk.storage.bunnycdn.com for London)
//   NOTIFY_TO        optional: email address for new requests
//   NOTIFY_FROM      optional: sender for that email, on a domain verified with Resend
// Secrets:
//   STORAGE_KEY      the storage zone's password (FTP & API Access)
//   RESEND_API_KEY   optional: Resend API key, to send the notification email

import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk@0.13.0";
import process from "node:process";

const env = (name: string, fallback = ""): string => (process.env[name] ?? fallback).trim();

const STORAGE_ZONE = env("STORAGE_ZONE");
const STORAGE_KEY = env("STORAGE_KEY");
const STORAGE_URL = env("STORAGE_URL") || `https://${env("STORAGE_HOST", "storage.bunnycdn.com")}`;
const SITE_PREFIX = "site";
const REQUEST_PREFIX = "requests";
const FEATURE_PREFIX = "features";

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  webmanifest: "application/manifest+json",
};

// How long browsers and the CDN keep each kind of file. Deploys purge the CDN.
function cacheFor(ext: string): string {
  if (ext === "html") return "public, max-age=300";
  if (ext === "css" || ext === "js") return "public, max-age=3600";
  return "public, max-age=86400";
}

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "script-src 'self'",
    "connect-src 'self'",
    "frame-src https://iframe.mediadelivery.net https://player.mediadelivery.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS },
  });
}

function storageUrl(path: string): string {
  return `${STORAGE_URL}/${encodeURIComponent(STORAGE_ZONE)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

// ---------- static files ----------

// Maps a URL path to a file under site/, or null if the path isn't allowed.
function sitePath(pathname: string): string | null {
  let p: string;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  if (p.includes("\0") || p.includes("\\")) return null;
  const parts = p.split("/").filter(Boolean);
  if (parts.some((s) => s === ".." || s === "." || s.startsWith("."))) return null;
  if (pathname.endsWith("/") || parts.length === 0) parts.push("index.html");
  else if (!parts[parts.length - 1].includes(".")) parts.push("index.html"); // /about -> /about/index.html
  return `${SITE_PREFIX}/${parts.join("/")}`;
}

async function fromStorage(path: string, method: string): Promise<Response | null> {
  const res = await fetch(storageUrl(path), { headers: { AccessKey: STORAGE_KEY } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Storage returned ${res.status} for ${path}`);
  const ext = path.split(".").pop()!.toLowerCase();
  const headers: Record<string, string> = {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    "Cache-Control": cacheFor(ext),
    ...SECURITY_HEADERS,
  };
  const etag = res.headers.get("etag");
  if (etag) headers["ETag"] = etag;
  const modified = res.headers.get("last-modified");
  if (modified) headers["Last-Modified"] = modified;
  return new Response(method === "HEAD" ? null : res.body, { status: 200, headers });
}

async function serveFile(url: URL, method: string): Promise<Response> {
  const path = sitePath(url.pathname);
  if (path) {
    const res = await fromStorage(path, method);
    if (res) return res;
  }
  const notFound = await fromStorage(`${SITE_PREFIX}/404.html`, method).catch(() => null);
  if (notFound) {
    return new Response(notFound.body, { status: 404, headers: { ...Object.fromEntries(notFound.headers), "Cache-Control": "public, max-age=60" } });
  }
  return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS } });
}

// ---------- the forms: test-instance requests and feature suggestions ----------

const recent = new Map<string, number[]>(); // per client, in this isolate only: a light brake, not a guarantee

function tooMany(client: string): boolean {
  const now = Date.now();
  const times = (recent.get(client) || []).filter((t) => now - t < 10 * 60_000);
  times.push(now);
  recent.set(client, times);
  if (recent.size > 5000) recent.clear();
  return times.length > 5;
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reads a form posted as JSON. Returns the fields, a Response to send back at once, or null
// for a bot (a filled-in honeypot), which is told "ok" and has nothing kept.
async function readForm(request: Request): Promise<Record<string, unknown> | Response | null> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return json(415, { error: "Send the form as JSON." });
  if (Number(request.headers.get("content-length") || 0) > 20_000) return json(413, { error: "That's too long." });
  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 20_000) return json(413, { error: "That's too long." });
    raw = JSON.parse(text);
  } catch {
    return json(400, { error: "The form couldn't be read." });
  }
  if (!raw || typeof raw !== "object") return json(400, { error: "The form couldn't be read." });
  if (clean(raw.website, 200)) return null;
  return raw;
}

function clientOf(request: Request): string {
  return request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

// Saves a record under <prefix>/YYYY/MM/<id>.json and returns it with its id, or a Response on failure.
async function store(prefix: string, request: Request, data: Record<string, unknown>): Promise<Record<string, string> | Response> {
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    id,
    received: now.toISOString(),
    ...data,
    country: request.headers.get("cdn-requestcountrycode") || "",
    userAgent: clean(request.headers.get("user-agent"), 300),
  };
  const path = `${prefix}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.json`;
  const put = await fetch(storageUrl(path), {
    method: "PUT",
    headers: { AccessKey: STORAGE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(record, null, 2),
  });
  if (!put.ok) {
    console.error(`Saving ${path} failed: ${put.status} ${await put.text().catch(() => "")}`);
    return json(502, { error: "That couldn't be saved." });
  }
  return record as Record<string, string>;
}

// Emails Simon about a new record, if Resend is set up (see the top of this file).
async function notify(subject: string, lines: string[], replyTo: string): Promise<void> {
  const key = env("RESEND_API_KEY");
  const to = env("NOTIFY_TO");
  const from = env("NOTIFY_FROM");
  if (!key || !to || !from) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...(replyTo ? { reply_to: replyTo } : {}), subject, text: lines.join("\n") }),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${await res.text().catch(() => "")}`);
}

const REQUEST_FIELDS: Record<string, number> = { name: 100, email: 200, organisation: 150, users: 40, existing: 60, message: 4000 };

async function saveRequest(request: Request): Promise<Response> {
  const raw = await readForm(request);
  if (raw === null) return json(200, { ok: true });
  if (raw instanceof Response) return raw;
  const data: Record<string, string> = {};
  for (const [k, max] of Object.entries(REQUEST_FIELDS)) data[k] = clean(raw[k], max);
  if (!data.name) return json(400, { error: "Enter your name." });
  if (!EMAIL.test(data.email)) return json(400, { error: "Enter an email address we can reply to." });
  const acknowledged = raw.acknowledged === true || ["yes", "on", "true"].includes(clean(raw.acknowledged, 10).toLowerCase());
  if (!acknowledged) return json(400, { error: "Please tick the box to confirm you understand it isn't ready for production use." });
  if (tooMany(clientOf(request))) return json(429, { error: "Too many requests from here." });

  const r = await store(REQUEST_PREFIX, request, { ...data, acknowledgedNotForProduction: true });
  if (r instanceof Response) return r;
  await notify(`Web Access Builder test instance request: ${r.organisation || r.name}`, [
    `Name: ${r.name}`,
    `Email: ${r.email}`,
    `Organisation: ${r.organisation || "-"}`,
    `Users: ${r.users || "-"}`,
    `Starting from: ${r.existing || "-"}`,
    "Confirmed it's a test, not for production: yes",
    `Country: ${r.country || "-"}`,
    "",
    r.message || "(no message)",
    "",
    `Saved as ${REQUEST_PREFIX}/…/${r.id}.json in the storage zone.`,
  ], r.email).catch((err) => console.error("Notification failed:", err));
  return json(200, { ok: true });
}

const FEATURE_FIELDS: Record<string, number> = { feature: 2000, area: 40, use: 4000, name: 100, email: 200 };
const AREAS = ["Tables", "Queries", "Forms", "Reports", "VBA and code", "Import and export", "Users and sharing", "Other"];

async function saveFeature(request: Request): Promise<Response> {
  const raw = await readForm(request);
  if (raw === null) return json(200, { ok: true });
  if (raw instanceof Response) return raw;
  const data: Record<string, string> = {};
  for (const [k, max] of Object.entries(FEATURE_FIELDS)) data[k] = clean(raw[k], max);
  if (data.feature.length < 5) return json(400, { error: "Describe the feature you'd like." });
  if (data.area && !AREAS.includes(data.area)) data.area = "Other";
  if (data.email && !EMAIL.test(data.email)) return json(400, { error: "That email address doesn't look right. Leave it empty if you'd rather not get a reply." });
  if (tooMany(clientOf(request))) return json(429, { error: "Too many suggestions from here. Please try again later." });

  const r = await store(FEATURE_PREFIX, request, data);
  if (r instanceof Response) return r;
  await notify(`Web Access Builder feature suggestion: ${r.feature.split("\n")[0].slice(0, 60)}`, [
    `Area: ${r.area || "-"}`,
    `From: ${r.name || "(no name)"}${r.email ? ` <${r.email}>` : ""}`,
    `Country: ${r.country || "-"}`,
    "",
    "The feature:",
    r.feature,
    "",
    "How they'd use it:",
    r.use || "(not said)",
    "",
    `Saved as ${FEATURE_PREFIX}/…/${r.id}.json in the storage zone.`,
  ], r.email).catch((err) => console.error("Notification failed:", err));
  return json(200, { ok: true });
}

// ---------- routing ----------

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/request") {
      if (request.method === "POST") return await saveRequest(request);
      return json(405, { error: "Use POST." });
    }
    if (url.pathname === "/api/feature") {
      if (request.method === "POST") return await saveFeature(request);
      return json(405, { error: "Use POST." });
    }
    if (url.pathname.startsWith("/api/")) return json(404, { error: "Not found." });
    if (request.method === "GET" || request.method === "HEAD") return await serveFile(url, request.method);
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD", ...SECURITY_HEADERS } });
  } catch (err) {
    console.error(err);
    return new Response("Something went wrong at the edge. Please try again.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS },
    });
  }
}

BunnySDK.net.http.serve(handle);
