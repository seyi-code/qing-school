import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DomainManager } from "./DomainManager";

export const dynamic = "force-dynamic";

export default async function PlatformDomainsPage() {
  const session = await requireSession();
  if (session.role !== "PLATFORM_ADMIN") redirect("/dashboard");

  const schools = await prisma.school.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      domainVerifiedAt: true,
    },
  });

  return (
    <PortalShell
      role={session.role}
      title="Custom domains"
      subtitle="Phase 4 — map a verified domain to a school public site"
      email={session.email}
    >
      <DomainManager
        schools={schools.map((s) => ({
          ...s,
          domainVerifiedAt: s.domainVerifiedAt?.toISOString() ?? null,
        }))}
      />
    </PortalShell>
  );
}
