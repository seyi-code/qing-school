import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { LibraryClient } from "./LibraryClient";
import { Kpi } from "@/components/ui/Kpi";

export const dynamic = "force-dynamic";

const ALLOWED = ["ADMIN", "IT", "SECRETARY", "TEACHER", "PRINCIPAL", "PLATFORM_ADMIN"];

export default async function LibraryPage() {
  const session = await requireSession();
  if (!ALLOWED.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  const [books, openLoans, students] = await Promise.all([
    prisma.libraryBook.findMany({ where: sw, orderBy: { title: "asc" } }),
    prisma.bookLoan.findMany({
      where: {
        returnedAt: null,
        ...(schoolId ? { student: { schoolId } } : {}),
      },
      include: {
        book: true,
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { borrowedAt: "desc" },
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE", ...sw },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 500,
    }),
  ]);

  const totalCopies = books.reduce((s, b) => s + b.copies, 0);
  const available = books.reduce((s, b) => s + b.available, 0);
  const overdue = openLoans.filter((l) => l.dueDate && new Date(l.dueDate) < new Date()).length;

  return (
    <PortalShell role={session.role} title="Library" subtitle="Catalogue and loans" email={session.email}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi label="Titles" value={String(books.length)} tone="navy" icon="📚" />
        <Kpi label="Copies" value={String(totalCopies)} tone="sky" icon="#" />
        <Kpi label="Available" value={String(available)} tone="sage" icon="✓" />
        <Kpi label="On loan" value={String(openLoans.length)} tone={overdue ? "rose" : "gold"} icon="↗" />
      </div>
      {overdue > 0 && (
        <p className="text-xs text-brick mb-3 font-medium">
          {overdue} overdue loan{overdue === 1 ? "" : "s"}
        </p>
      )}
      <LibraryClient
        books={books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          copies: b.copies,
          available: b.available,
        }))}
        loans={openLoans.map((l) => ({
          id: l.id,
          bookTitle: l.book.title,
          studentName: `${l.student.firstName} ${l.student.lastName}`,
          admissionNumber: l.student.admissionNumber,
          borrowedAt: formatDate(l.borrowedAt),
          dueDate: l.dueDate ? formatDate(l.dueDate) : "-",
        }))}
        students={students.map((s) => ({
          id: s.id,
          label: `${s.lastName}, ${s.firstName} (${s.admissionNumber})`,
        }))}
      />
    </PortalShell>
  );
}
