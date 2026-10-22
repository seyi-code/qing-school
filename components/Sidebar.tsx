"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { KMS_LOGO_URL } from "@/lib/branding";

interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  icon: string;
}

/**
 * Role-based navigation.
 * IT = technical co-admin (ops, data, settings) — not fee collection.
 * Password lives under header account menu (Profile), not duplicated here.
 */
const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "⌂",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL", "ACCOUNTANT"],
  },
  {
    href: "/platform",
    label: "Platform (SaaS)",
    icon: "◆",
    roles: ["PLATFORM_ADMIN"],
  },
  {
    href: "/onboarding",
    label: "Onboard school",
    icon: "+",
    roles: ["PLATFORM_ADMIN"],
  },
  {
    href: "/portal/student",
    label: "My Portal",
    icon: "🎓",
    roles: ["STUDENT"],
  },
  {
    href: "/portal/parent",
    label: "Family dashboard",
    icon: "👨‍👩‍👧",
    roles: ["PARENT"],
  },
  {
    href: "/portal/teacher",
    label: "Teacher Portal",
    icon: "👩‍🏫",
    roles: ["TEACHER"],
  },
  {
    href: "/notices",
    label: "School notices",
    icon: "📢",
    roles: ["PARENT"],
  },
  {
    href: "/result-checker",
    label: "Result checker",
    icon: "📊",
    roles: ["PARENT"],
  },
  {
    href: "/students",
    label: "Students",
    icon: "🎓",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL", "TEACHER"],
  },
  {
    href: "/staff",
    label: "Staff",
    icon: "👥",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
  {
    href: "/leave",
    label: "Staff Leave",
    icon: "📅",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "PRINCIPAL", "TEACHER", "SECRETARY"],
  },
  {
    href: "/classes",
    label: "Classes & Subjects",
    icon: "🏫",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
  {
    href: "/timetable",
    label: "Timetable",
    icon: "🗓",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "TEACHER", "PRINCIPAL"],
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: "✓",
    roles: ["PLATFORM_ADMIN", "ADMIN", "TEACHER", "IT"],
  },
  {
    href: "/exams",
    label: "Scores / CA",
    icon: "📝",
    roles: ["PLATFORM_ADMIN", "ADMIN", "TEACHER", "IT", "PRINCIPAL"],
  },
  {
    href: "/cbt",
    label: "CBT",
    icon: "💻",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "TEACHER", "PRINCIPAL", "STUDENT"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "📊",
    roles: ["PLATFORM_ADMIN", "ADMIN", "PRINCIPAL", "IT"],
  },
  {
    href: "/fees",
    label: "Fees",
    icon: "₦",
    roles: ["PLATFORM_ADMIN", "ADMIN", "ACCOUNTANT", "SECRETARY"],
  },
  {
    href: "/fees/structure",
    label: "Fee structure",
    icon: "📋",
    roles: ["PLATFORM_ADMIN", "ADMIN", "ACCOUNTANT"],
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: "💸",
    roles: ["PLATFORM_ADMIN", "ADMIN", "ACCOUNTANT"],
  },
  {
    href: "/payroll",
    label: "Payroll",
    icon: "💼",
    roles: ["PLATFORM_ADMIN", "ADMIN", "ACCOUNTANT"],
  },
  {
    href: "/modules",
    label: "Modules hub",
    icon: "▦",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL"],
  },
  {
    href: "/library",
    label: "Library",
    icon: "📚",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "TEACHER", "PRINCIPAL"],
  },
  {
    href: "/hostel",
    label: "Hostel",
    icon: "🏘",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL"],
  },
  {
    href: "/transport",
    label: "Transport",
    icon: "🚌",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL", "ACCOUNTANT"],
  },
  {
    href: "/notices",
    label: "Notices",
    icon: "📢",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL"],
  },
  {
    href: "/cms",
    label: "Website CMS",
    icon: "🌐",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
  {
    href: "/settings",
    label: "Admin Settings",
    icon: "⚙",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
  {
    href: "/settings/ops",
    label: "Ops / SMS / Backup",
    icon: "🛠",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
  {
    href: "/settings/audit",
    label: "Audit trail",
    icon: "📜",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
  {
    href: "/settings/report-template",
    label: "Report designer",
    icon: "🖨",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT", "PRINCIPAL"],
  },
  {
    href: "/settings/go-live",
    label: "Go-live checklist",
    icon: "🚀",
    roles: ["PLATFORM_ADMIN", "ADMIN", "IT"],
  },
];

function rolePortalLabel(role: Role): string {
  switch (role) {
    case "PLATFORM_ADMIN":
      return "Platform admin portal";
    case "ADMIN":
      return "School admin portal";
    case "IT":
      return "IT portal";
    case "PRINCIPAL":
      return "Principal portal";
    case "SECRETARY":
      return "Secretary portal";
    case "ACCOUNTANT":
      return "Accounts portal";
    case "TEACHER":
      return "Teacher portal";
    case "STUDENT":
      return "Student portal";
    case "PARENT":
      return "Parent portal";
    default:
      return "Portal";
  }
}

export function Sidebar({
  role,
  onNavigate,
  schoolLabel,
  schoolName,
}: {
  role: Role;
  onNavigate?: () => void;
  schoolLabel?: string;
  schoolName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const workingAsSchool = Boolean(schoolLabel);
  const visible = NAV_ITEMS.filter((item) => {
    if (!item.roles.includes(role)) return false;
    if (workingAsSchool && (item.href === "/platform" || item.href === "/onboarding")) {
      return false;
    }
    return true;
  });

  const brand = schoolLabel || schoolName || "Qing School";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 max-w-full h-full max-h-dvh bg-[#0c2744] text-paper flex flex-col no-print">
      <div className="px-4 py-4 border-b border-white/10 flex items-start justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={KMS_LOGO_URL}
            alt=""
            className="w-10 h-10 rounded-full object-contain bg-white/10 border border-white/15 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-serif text-base leading-tight truncate text-white" title={schoolName || brand}>
              {brand}
            </p>
            <p className="text-[10px] text-[#d2ae3b]/90 truncate font-semibold tracking-wide uppercase mt-0.5">
              {rolePortalLabel(role)}
            </p>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="lg:hidden text-paper/70 hover:text-[#d2ae3b] text-2xl leading-none px-1"
            aria-label="Close menu"
          >
            &times;
          </button>
        )}
      </div>

      <nav className="flex-1 min-h-0 py-2 overflow-y-auto overscroll-contain px-2">
        {visible.map((item) => {
          const matches = visible.filter(
            (i) => pathname === i.href || pathname.startsWith(i.href + "/")
          );
          const best =
            matches.length === 0
              ? null
              : matches.reduce((a, b) => (a.href.length >= b.href.length ? a : b));
          const active = best?.href === item.href;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 mx-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#d2ae3b]/15 text-[#f1d264] shadow-sm"
                  : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm ${
                  active ? "bg-[#d2ae3b]/25" : "bg-white/5"
                }`}
                aria-hidden
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 p-3 border-t border-white/10 space-y-2">
        {schoolName && (
          <p className="text-[10px] text-white/40 text-center truncate px-1" title={schoolName}>
            {schoolName}
          </p>
        )}
        {role === "PLATFORM_ADMIN" && workingAsSchool && (
          <Link
            href="/platform"
            onClick={onNavigate}
            className="block text-center text-xs font-semibold py-2 rounded-lg border border-[#d2ae3b]/40 text-[#f1d264] hover:bg-[#d2ae3b]/10"
          >
            ← Back to platform
          </Link>
        )}
        <Link
          href="/account/profile"
          onClick={onNavigate}
          className="block text-center text-xs font-semibold py-2.5 rounded-lg border border-white/15 text-white/80 hover:border-[#d2ae3b]/50 hover:text-[#f1d264]"
        >
          My profile
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full text-xs font-semibold py-2.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
