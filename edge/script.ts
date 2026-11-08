// webaccess marketing site: Bunny Edge Script (standalone).
//
// GET  /...           serves the site's files from the storage zone, under site/
// POST /api/request   saves a "request an instance" form to the storage zone, under requests/,
//                     and emails a notification if RESEND_API_KEY is set
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

// ---------- the request form ----------

const LIMITS: Record<string, number> = { name: 100, email: 200, organisation: 150, users: 40, existing: 60, message: 4000 };
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

async function saveRequest(request: Request): Promise<Response> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return json(415, { error: "Send the form as JSON." });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 20_000) return json(413, { error: "That's too long." });

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 20_000) return json(413, { error: "That's too long." });
    raw = JSON.parse(text);
  } catch {
    return json(400, { error: "The form couldn't be read." });
  }
  if (!raw || typeof raw !== "object") return json(400, { error: "The form couldn't be read." });

  // A filled-in honeypot means a bot: say yes and keep nothing.
  if (clean(raw.website, 200)) return json(200, { ok: true });

  const data: Record<string, string> = {};
  for (const [k, max] of Object.entries(LIMITS)) data[k] = clean(raw[k], max);
  if (!data.name) return json(400, { error: "Enter your name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json(400, { error: "Enter an email address we can reply to." });

  const client = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooMany(client)) return json(429, { error: "Too many requests from here." });

  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    id,
    received: now.toISOString(),
    ...data,
    country: request.headers.get("cdn-requestcountrycode") || "",
    userAgent: clean(request.headers.get("user-agent"), 300),
  };
  const path = `${REQUEST_PREFIX}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.json`;
  const put = await fetch(storageUrl(path), {
    method: "PUT",
    headers: { AccessKey: STORAGE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(record, null, 2),
  });
  if (!put.ok) {
    console.error(`Saving request failed: ${put.status} ${await put.text().catch(() => "")}`);
    return json(502, { error: "The request couldn't be saved." });
  }

  await notify(record).catch((err) => console.error("Notification failed:", err));
  return json(200, { ok: true });
}

async function notify(r: Record<string, string>): Promise<void> {
  const key = env("RESEND_API_KEY");
  const to = env("NOTIFY_TO");
  const from = env("NOTIFY_FROM");
  if (!key || !to || !from) return;
  const lines = [
    `Name: ${r.name}`,
    `Email: ${r.email}`,
    `Organisation: ${r.organisation || "-"}`,
    `Users: ${r.users || "-"}`,
    `Starting from: ${r.existing || "-"}`,
    `Country: ${r.country || "-"}`,
    "",
    r.message || "(no message)",
    "",
    `Saved as ${r.id}.json in the storage zone.`,
  ];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: r.email,
      subject: `webaccess instance request: ${r.organisation || r.name}`,
      text: lines.join("\n"),
    }),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${await res.text().catch(() => "")}`);
}

// ---------- routing ----------

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/request") {
      if (request.method === "POST") return await saveRequest(request);
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
