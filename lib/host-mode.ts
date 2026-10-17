/**
 * Phase 1 host classification — SaaS marketing vs app hub vs legacy.
 *
 * Env (optional; empty = legacy behaviour, zero breakage on *.vercel.app):
 *   NEXT_PUBLIC_MARKETING_HOSTS=seyicode.com,www.seyicode.com
 *   NEXT_PUBLIC_APP_HOST=app.seyicode.com
 *
 * Legacy (qing-school.vercel.app, staging, localhost): flagship school site + app on same host.
 */

export type HostMode = "marketing" | "app" | "legacy";

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeHost(hostHeader: string | null | undefined): string {
  return (hostHeader || "").split(":")[0].trim().toLowerCase();
}

export function getMarketingHosts(): string[] {
  return parseList(process.env.NEXT_PUBLIC_MARKETING_HOSTS);
}

export function getAppHost(): string | null {
  const h = (process.env.NEXT_PUBLIC_APP_HOST || "").trim().toLowerCase();
  return h || null;
}

export function classifyHost(hostHeader: string | null | undefined): HostMode {
  const host = normalizeHost(hostHeader);
  if (!host) return "legacy";

  const marketing = getMarketingHosts();
  if (marketing.length && marketing.includes(host)) return "marketing";

  const appHost = getAppHost();
  if (appHost && host === appHost) return "app";

  // Explicit app. subdomain on a known root (e.g. app.seyicode.com without env yet)
  if (host.startsWith("app.")) return "app";

  return "legacy";
}

/** Absolute origin for the app hub (login / portals). Falls back to current origin. */
export function appOrigin(fallbackOrigin: string): string {
  const appHost = getAppHost();
  if (!appHost) return fallbackOrigin.replace(/\/$/, "");
  const proto = fallbackOrigin.startsWith("https") ? "https" : "https";
  return `${proto}://${appHost}`;
}

export function marketingOrigin(fallbackOrigin: string): string {
  const hosts = getMarketingHosts();
  if (!hosts.length) return fallbackOrigin.replace(/\/$/, "");
  const preferred = hosts.find((h) => h.startsWith("www.")) || hosts[0];
  return `https://${preferred}`;
}
