import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * PLATFORM_ADMIN only — multi-tenant isolation health check.
 * Run after onboarding ≥2 schools. Flags orphan rows and prefix collisions.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden — platform admin only" }, { status: 403 });
  }

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      isActive: true,
      subscriptionStatus: true,
      _count: {
        select: {
          students: true,
          staff: true,
          classes: true,
          users: true,
        },
      },
    },
  });

  const orphanStudents = await prisma.student.count({ where: { schoolId: null } });
  const orphanStaff = await prisma.staff.count({ where: { schoolId: null } });
  const orphanClasses = await prisma.schoolClass.count({ where: { schoolId: null } });

  const perSchool = await Promise.all(
    schools.map(async (s) => {
      const [invoices, payments, notices, arms, sampleAdmissions] = await Promise.all([
        prisma.invoice.count({ where: { student: { schoolId: s.id } } }),
        prisma.payment.count({ where: { student: { schoolId: s.id } } }),
        prisma.notice.count({ where: { schoolId: s.id } }),
        prisma.arm.count({ where: { schoolClass: { schoolId: s.id } } }),
        prisma.student.findMany({
          where: { schoolId: s.id },
          select: { admissionNumber: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const tag = (s.shortName || s.slug || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      const prefixMismatches = sampleAdmissions.filter(
        (st) => tag && !st.admissionNumber.toUpperCase().startsWith(tag)
      ).length;

      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        isActive: s.isActive,
        subscriptionStatus: s.subscriptionStatus,
        students: s._count.students,
        staff: s._count.staff,
        classes: s._count.classes,
        users: s._count.users,
        arms,
        invoices,
        payments,
        notices,
        sampleAdmissions: sampleAdmissions.map((x) => x.admissionNumber),
        prefixMismatches,
      };
    })
  );

  const warnings: string[] = [];
  if (schools.length < 2) {
    warnings.push("Fewer than 2 schools — onboard a second tenant to validate isolation.");
  }
  if (orphanStudents > 0) warnings.push(`${orphanStudents} student(s) with null schoolId`);
  if (orphanStaff > 0) warnings.push(`${orphanStaff} staff with null schoolId`);
  if (orphanClasses > 0) warnings.push(`${orphanClasses} class(es) with null schoolId`);
  for (const s of perSchool) {
    if (s.prefixMismatches > 0) {
      warnings.push(
        `${s.slug}: ${s.prefixMismatches} sample admission number(s) do not start with ${s.shortName}`
      );
    }
  }

  const ok = schools.length >= 2 && orphanStudents === 0 && orphanStaff === 0 && orphanClasses === 0;

  return NextResponse.json({
    ok,
    checkedAt: new Date().toISOString(),
    schoolCount: schools.length,
    orphans: { students: orphanStudents, staff: orphanStaff, classes: orphanClasses },
    schools: perSchool,
    warnings,
    checklist: [
      "Work as School A → Students list only A",
      "Work as School B → Students list only B",
      "Reports CSV admission prefixes match school shortName",
      "Fees / Payroll / Leave empty or own data only",
      "CMS pages not shared across schools",
    ],
  });
}
