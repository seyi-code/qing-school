import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { redirect } from "next/navigation";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { PortalNoticesList } from "./PortalNoticesList";
import Link from "next/link";

export const dynamic = "force-dynamic";

const AUDIENCE_BY_ROLE: Record<string, string[]> = {
  STUDENT: ["ALL", "STUDENTS"],
  PARENT: ["ALL", "PARENTS"],
  TEACHER: ["ALL", "STAFF"],
};

export default async function PortalNoticesPage() {
  const session = await requireSession();
  const allowed = AUDIENCE_BY_ROLE[session.role];
  if (!allowed) {
    if (["ADMIN", "PLATFORM_ADMIN", "IT", "PRINCIPAL", "SECRETARY"].includes(session.role)) {
      redirect("/notices");
    }
    redirect("/dashboard");
  }

  const schoolId = await resolveSchoolId(session);
  const notices = await prisma.notice.findMany({
    where: {
      ...schoolWhere(schoolId),
      audience: { in: allowed },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const home =
    session.role === "STUDENT"
      ? "/portal/student"
      : session.role === "PARENT"
        ? "/portal/parent"
        : "/portal/teacher";

  return (
    <PortalShell
      role={session.role}
      title="School notices"
      subtitle="Announcements for you from the school"
      email={session.email}
      actions={
        <Link href={home} className="btn-ghost text-sm">
          ← Portal home
        </Link>
      }
    >
      <section className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white p-4 sm:p-5 shadow-sm">
        <PortalNoticesList
          notices={notices.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            audience: n.audience,
            createdAt: n.createdAt,
          }))}
          replyAsName={session.email?.split("@")[0] || "Portal user"}
          replyContact={session.email || ""}
        />
      </section>
    </PortalShell>
  );
}
