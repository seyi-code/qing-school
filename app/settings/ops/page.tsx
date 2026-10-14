import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Kpi } from "@/components/ui/Kpi";
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
        <Link href="/settings" className="text-sm border border-navy text-navy px-3 py-1.5">
          Back to Settings
        </Link>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 max-w-2xl">
        <Kpi
          label="Session secret"
          value={sessionSecretOk ? "OK" : "Weak"}
          tone={sessionSecretOk ? "sage" : "rose"}
          icon={sessionSecretOk ? "✓" : "!"}
        />
        <Kpi
          label="Database"
          value={databaseUrl ? "Set" : "Missing"}
          tone={databaseUrl ? "sage" : "rose"}
          icon="#"
        />
        <Kpi
          label="Termii SMS"
          value={termiiKey ? "Live" : "Off"}
          tone={termiiKey ? "sage" : "gold"}
          icon="📱"
        />
        <Kpi label="SMS (7 days)" value={String(recentSms)} tone="sky" icon="📢" />
      </div>
      <div className="space-y-6 max-w-2xl">
        <section className="ledger-block space-y-3">
          <h2 className="font-serif text-lg">Environment health</h2>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between gap-2 border-b border-line pb-2">
              <span>SESSION_SECRET</span>
              <span className={sessionSecretOk ? "text-sage font-medium" : "text-brick font-medium"}>
                {sessionSecretOk ? "OK" : "Missing / short"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-line pb-2">
              <span>DATABASE_URL</span>
              <span className={databaseUrl ? "text-sage font-medium" : "text-brick font-medium"}>
                {databaseUrl ? "Set" : "Missing"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-line pb-2">
              <span>Termii SMS API</span>
              <span className={termiiKey ? "text-sage font-medium" : "text-ink/50"}>
                {termiiKey ? `Key set · sender ${sender}` : "Not configured"}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-b border-line pb-2">
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

        <section className="ledger-block space-y-3">
          <h2 className="font-serif text-lg">Backup</h2>
          <div className="text-xs text-ink/60 space-y-2">
            <p className="font-medium text-ink">Backup story (product requirement):</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                <strong>Primary:</strong> Use your Postgres host automated backups (Neon / Supabase
                / Railway point-in-time recovery). Enable daily snapshots minimum.
              </li>
              <li>
                <strong>Weekly export:</strong> From provider dashboard export a logical dump, or
                use pg_dump into encrypted off-site storage.
              </li>
              <li>
                <strong>App data:</strong> Report logos and uploads live on Vercel Blob / storage -
                keep the same retention policy.
              </li>
              <li>
                <strong>Before major changes:</strong> Snapshot DB, then deploy. Keep
                ALLOW_SETUP_SEED=false in production.
              </li>
              <li>
                <strong>Restore drill:</strong> Once a term, restore a backup to a staging branch
                and verify login + student counts.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
