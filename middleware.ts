import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { classifyHost, getAppHost, normalizeHost } from "@/lib/host-mode";

const PUBLIC_PATHS = [
  "/login",
  "/account/forgot-password",
  "/account/reset-password",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/result-checker",
  "/api/setup",
  "/api/admissions",
  "/api/complaints",
  "/api/webhooks",
  "/api/fees/payments/confirm",
  "/",
  "/saas",
  "/admissions",
  "/complaints",
  "/contact",
  "/result-checker",
  "/pay",
  "/p",
];

/**
 * Path prefixes limited to specific roles.
 * PLATFORM_ADMIN may access school-ops paths (staff, payroll, settings)
 * while working as a tenant, but not student/parent/teacher portals.
 * Onboarding is platform-only — never public.
 */
const PORTAL_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/onboarding", roles: ["PLATFORM_ADMIN"] },
  { prefix: "/platform", roles: ["PLATFORM_ADMIN"] },
  { prefix: "/portal/student", roles: ["STUDENT"] },
  { prefix: "/portal/parent", roles: ["PARENT"] },
  { prefix: "/portal/teacher", roles: ["TEACHER"] },
  { prefix: "/staff", roles: ["ADMIN", "IT", "PLATFORM_ADMIN"] },
  { prefix: "/payroll", roles: ["ADMIN", "ACCOUNTANT", "PLATFORM_ADMIN"] },
  { prefix: "/settings", roles: ["ADMIN", "IT", "PRINCIPAL", "PLATFORM_ADMIN"] },
];

async function getSessionFromCookie(req: NextRequest): Promise<{
  role: string | null;
  mustChangePassword: boolean;
}> {
  const token = req.cookies.get("kms_session")?.value;
  if (!token) return { role: null, mustChangePassword: false };
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    return {
      role: (payload.role as string) ?? null,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return { role: null, mustChangePassword: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hostHeader = req.headers.get("host") || "";
  const hostNoPort = normalizeHost(hostHeader);
  const hostMode = classifyHost(hostHeader);
  const hostParts = hostNoPort.split(".");
  let schoolSlug: string | null = null;
  if (hostParts.length >= 3 && !["www", "app", "api"].includes(hostParts[0])) {
    schoolSlug = hostParts[0];
  }

  // Phase 1: marketing host serves SaaS landing at `/` (rewrite — URL stays `/`)
  if (hostMode === "marketing" && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/saas";
    const res = NextResponse.rewrite(url);
    res.headers.set("x-host-mode", hostMode);
    return res;
  }

  // Optional: send portal login from marketing site to app host when configured
  const appHost = getAppHost();
  if (
    hostMode === "marketing" &&
    appHost &&
    (pathname === "/login" || pathname.startsWith("/login/"))
  ) {
    const dest = new URL(req.url);
    dest.host = appHost;
    dest.protocol = "https:";
    dest.port = "";
    return NextResponse.redirect(dest);
  }

  // Marketing host: block platform/onboarding entry (use app host)
  if (
    hostMode === "marketing" &&
    (pathname.startsWith("/platform") || pathname.startsWith("/onboarding"))
  ) {
    if (appHost) {
      const dest = new URL(pathname, `https://${appHost}`);
      return NextResponse.redirect(dest);
    }
    return NextResponse.redirect(new URL("/saas", req.url));
  }

  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/kms-home") ||
    pathname.startsWith("/campus")
  ) {
    const res = NextResponse.next();
    if (schoolSlug) res.headers.set("x-school-slug", schoolSlug);
    res.headers.set("x-host-mode", hostMode);
    return res;
  }

  const { role, mustChangePassword } = await getSessionFromCookie(req);

  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    if (hostMode === "marketing" && appHost) {
      loginUrl.host = appHost;
      loginUrl.protocol = "https:";
      loginUrl.port = "";
    }
    return NextResponse.redirect(loginUrl);
  }

  if (
    mustChangePassword &&
    !pathname.startsWith("/account/password") &&
    !pathname.startsWith("/api/auth/change-password") &&
    !pathname.startsWith("/api/auth/logout")
  ) {
    return NextResponse.redirect(new URL("/account/password", req.url));
  }

  for (const rule of PORTAL_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (!rule.roles.includes(role)) {
        const fallback = role === "PLATFORM_ADMIN" ? "/platform" : "/dashboard";
        return NextResponse.redirect(new URL(fallback, req.url));
      }
    }
  }

  const res = NextResponse.next();
  if (schoolSlug) res.headers.set("x-school-slug", schoolSlug);
  res.headers.set("x-host-mode", hostMode);
  return res;
}

/**
 * Skip middleware for Next internals and static files under /public.
 * Previously only .png was excluded — .jpg under /kms-home was redirected to /login
 * (browser then showed broken images / alt text on the homepage).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$).*)",
  ],
};
