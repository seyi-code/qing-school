import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { passwordPolicyHint, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const session = await requireSession();

  return (
    <PortalShell
      role={session.role}
      title="Security"
      subtitle="Password policy and account safety"
      email={session.email}
      actions={
        <Link href="/settings" className="btn-ghost text-sm">
          Back to Settings
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <section className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-serif text-lg text-navy mb-2">Change your password</h2>
          <ChangePasswordForm />
        </section>
        <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 shadow-sm text-sm space-y-2">
          <h2 className="font-serif text-lg text-navy mb-2">Policy</h2>
          <ul className="list-disc pl-5 space-y-1 text-ink/70">
            <li>Minimum length: {PASSWORD_MIN_LENGTH}</li>
            <li>{passwordPolicyHint()}</li>
            <li>New staff get a strong random temporary password — reset from Staff after hire.</li>
            <li>Admins should change seed/demo passwords immediately after go-live.</li>
            <li>Sessions use httpOnly signed cookies (7-day expiry).</li>
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
