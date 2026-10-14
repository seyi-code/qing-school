import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { HostelClient } from "./HostelClient";
import { Kpi } from "@/components/ui/Kpi";

export const dynamic = "force-dynamic";

const ALLOWED = ["ADMIN", "IT", "SECRETARY", "PRINCIPAL", "PLATFORM_ADMIN"];

export default async function HostelPage() {
  const session = await requireSession();
  if (!ALLOWED.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  const [rooms, students] = await Promise.all([
    prisma.hostelRoom.findMany({
      where: sw,
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, admissionNumber: true },
            },
          },
        },
      },
      orderBy: [{ block: "asc" }, { name: "asc" }],
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE", ...sw },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 500,
    }),
  ]);

  const capacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupied = rooms.reduce((s, r) => s + r.allocations.length, 0);
  const freeBeds = Math.max(0, capacity - occupied);

  return (
    <PortalShell role={session.role} title="Hostel" subtitle="Rooms and bed allocation" email={session.email}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi label="Rooms" value={String(rooms.length)} tone="navy" icon="🛏" />
        <Kpi label="Capacity" value={String(capacity)} tone="sky" icon="#" />
        <Kpi label="Occupied" value={String(occupied)} tone="gold" icon="👤" />
        <Kpi label="Free beds" value={String(freeBeds)} tone={freeBeds ? "sage" : "rose"} icon="✓" />
      </div>
      <HostelClient
        rooms={rooms.map((r) => ({
          id: r.id,
          name: r.name,
          block: r.block,
          capacity: r.capacity,
          gender: r.gender,
          occupied: r.allocations.length,
          allocations: r.allocations.map((a) => ({
            id: a.id,
            bedLabel: a.bedLabel,
            studentName: `${a.student.firstName} ${a.student.lastName}`,
            admissionNumber: a.student.admissionNumber,
          })),
        }))}
        students={students.map((s) => ({
          id: s.id,
          label: `${s.lastName}, ${s.firstName} (${s.admissionNumber})`,
        }))}
      />
    </PortalShell>
  );
}
