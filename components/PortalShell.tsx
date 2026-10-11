"use client";

import { useState, useEffect } from "react";
import type { Role } from "@prisma/client";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

export function PortalShell({
  role,
  title,
  subtitle,
  email,
  schoolName: schoolNameProp,
  schoolShortName: schoolShortProp,
  actions,
  children,
}: {
  role: Role;
  title: string;
  subtitle?: string;
  email?: string;
  /** Active tenant label — preferred for multi-school context */
  schoolName?: string;
  schoolShortName?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schoolName, setSchoolName] = useState(schoolNameProp || "");
  const [schoolShort, setSchoolShort] = useState(schoolShortProp || "");

  useEffect(() => {
    if (schoolNameProp) {
      setSchoolName(schoolNameProp);
      setSchoolShort(schoolShortProp || "");
      return;
    }
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        if (d.schoolName) setSchoolName(d.schoolName);
        if (d.schoolShortName) setSchoolShort(d.schoolShortName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [schoolNameProp, schoolShortProp]);

  const tenantLabel = schoolShort || schoolName;

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="hidden lg:flex lg:shrink-0 lg:h-screen lg:sticky lg:top-0">
        <Sidebar role={role} schoolLabel={tenantLabel} schoolName={schoolName} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full max-h-dvh w-[min(18rem,85vw)] shadow-xl">
            <Sidebar
              role={role}
              schoolLabel={tenantLabel}
              schoolName={schoolName}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-line bg-paper px-4 sm:px-6 lg:px-8 py-3 sm:py-4 no-print sticky top-0 z-30">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="lg:hidden mt-0.5 shrink-0 w-10 h-10 flex flex-col items-center justify-center gap-1.5 border border-line bg-white"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <span className="block w-5 h-0.5 bg-navy" />
              <span className="block w-5 h-0.5 bg-navy" />
              <span className="block w-5 h-0.5 bg-navy" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {schoolName && (
                    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-navy/70 font-medium mb-0.5 truncate">
                      {schoolName}
                      {schoolShort && schoolShort !== schoolName ? (
                        <span className="text-ink/40 normal-case tracking-normal"> · {schoolShort}</span>
                      ) : null}
                    </p>
                  )}
                  <h1 className="font-serif text-xl sm:text-2xl text-ink leading-tight break-words">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-ink/60 mt-0.5 break-words">{subtitle}</p>
                  )}
                </div>
                <UserMenu email={email} />
              </div>

              {actions && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">{actions}</div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function StatBlock({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive" ? "text-sage" : tone === "warning" ? "text-brick" : "text-ink";
  return (
    <div className="ledger-block h-full">
      <p className="text-[10px] sm:text-xs uppercase tracking-wide text-ink/50 leading-snug">{label}</p>
      <p className={`ledger-number text-2xl sm:text-3xl mt-1 break-words ${toneClass}`}>{value}</p>
      {sublabel && <p className="text-[10px] sm:text-xs text-ink/50 mt-1">{sublabel}</p>}
    </div>
  );
}
