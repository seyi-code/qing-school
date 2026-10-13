import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const session = await requireSession();
  if (!["ADMIN", "IT", "PLATFORM_ADMIN"].includes(session.role)) {
    redirect(homeRouteForRole(session.role));
  }

  const termiiKey = !!process.env.TERMII_API_KEY;
  const sender = process.env.TERMII_SENDER_ID || "KMS";
  const sessionSecretOk = !!(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
  const databaseUrl = !!process.env.DATABASE_URL;
  const allowSeed = process.env.ALLOW_SETUP_SEED === "true";

  const recentSms = await prisma.messageLog.count({
    where: { channel: "SMS", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  return (
    <PortalShell
      role={session.role}
      title="Operations"
      subtitle="SMS production keys, backup, and production hygiene"
      email={session.email}
      actions={
        <Link href="/settings" className="btn-ghost">
          Admin settings
        </Link>
      }
    >
      <div className="space-y-5 max-w-2xl">
        <section className="ledger-block">
          <h2 className="font-serif text-lg text-navy mb-3">Environment health</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-2 border-b border-line/60 pb-2">
              <span>SESSION_SECRET</span>
              <span className={sessionSecretOk ? "text-sage font-medium" : "text-brick font-medium"}>
                {sessionSecretOk ? "OK" : "Missing / short"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-line/60 pb-2">
              <span>DATABASE_URL</span>
              <span className={databaseUrl ? "text-sage font-medium" : "text-brick font-medium"}>
                {databaseUrl ? "Set" : "Missing"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-line/60 pb-2">
              <span>Termii SMS API</span>
              <span className={termiiKey ? "text-sage font-medium" : "text-ink/50"}>
                {termiiKey ? `Key set · sender ${sender}` : "Not configured"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-line/60 pb-2">
              <span>SMS last 7 days</span>
              <span className="tabular-nums font-medium">{recentSms}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>ALLOW_SETUP_SEED</span>
              <span className={allowSeed ? "text-amber-800 font-medium" : "text-sage font-medium"}>
                {allowSeed ? "ON (disable in production)" : "Off"}
              </span>
            </li>
          </ul>
        </section>

        <section className="ledger-block text-sm text-ink/70 space-y-2">
          <h2 className="font-serif text-lg text-navy">Backup</h2>
          <p>
            Use your Neon / Postgres dashboard for automated backups. Export critical tables via Reports
            CSV before large schema changes.
          </p>
          <Link href="/reports" className="btn-ghost inline-flex">
            Open reports
          </Link>
        </section>
      </div>
    </PortalShell>
  );
}
