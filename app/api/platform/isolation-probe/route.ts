import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { repairLegacyAdmissionNumbers } from "@/lib/admission";
import { PLAN_STUDENT_CAPS } from "@/lib/plan-caps";

/**
 * PLATFORM_ADMIN only — multi-tenant isolation health check.
 * Also repairs legacy admission numbers (FS/… → KMS/MAT/2026/0001).
 * Aligns Test STARTER cap to 500 when still on old 300.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden — platform admin only" }, { status: 403 });
  }

  const admissionRepair = await repairLegacyAdmissionNumbers().catch((err) => {
    console.error("[isolation-probe] admission repair failed", err);
    return { fixed: 0, details: [] as Array<{ from: string; to: string }> };
  });

  const capFix = await prisma.school.updateMany({
    where: {
      plan: "STARTER",
      maxStudents: { lt: PLAN_STUDENT_CAPS.STARTER },
    },
    data: { maxStudents: PLAN_STUDENT_CAPS.STARTER },
  });

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { students: true, staff: true, classes: true, users: true } },
    },
  });

  const orphanStudents = await prisma.student.count({ where: { schoolId: null } });
  const orphanStaff = await prisma.staff.count({ where: { schoolId: null } });
  const orphanClasses = await prisma.schoolClass.count({ where: { schoolId: null } });
  const orphanCmsPages = await prisma.cmsPage.count({ where: { schoolId: null } });
  const orphanMedia = await prisma.mediaAsset.count({ where: { schoolId: null } });
  const orphanNotices = await prisma.notice.count({ where: { schoolId: null } });
  const orphanInvoices = await prisma.invoice.count({ where: { schoolId: null } });
  const orphanUsers = await prisma.user.count({
    where: { schoolId: null, role: { not: "PLATFORM_ADMIN" } },
  });

  const perSchool = await Promise.all(
    schools.map(async (s) => {
      const [invoices, payments, notices, arms, cmsPages, mediaAssets, sampleAdmissions] =
        await Promise.all([
          prisma.invoice.count({ where: { schoolId: s.id } }),
          prisma.payment.count({ where: { schoolId: s.id } }),
          prisma.notice.count({ where: { schoolId: s.id } }),
          prisma.arm.count({ where: { schoolClass: { schoolId: s.id } } }),
          prisma.cmsPage.count({ where: { schoolId: s.id } }),
          prisma.mediaAsset.count({ where: { schoolId: s.id } }),
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
        cmsPages,
        mediaAssets,
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
  if (orphanCmsPages > 0) warnings.push(`${orphanCmsPages} CMS page(s) with null schoolId`);
  if (orphanMedia > 0) warnings.push(`${orphanMedia} media asset(s) with null schoolId`);
  if (orphanNotices > 0) warnings.push(`${orphanNotices} notice(s) with null schoolId`);
  if (orphanInvoices > 0) warnings.push(`${orphanInvoices} invoice(s) with null schoolId`);
  if (orphanUsers > 0) warnings.push(`${orphanUsers} non-platform user(s) with null schoolId`);
  for (const s of perSchool) {
    if (s.prefixMismatches > 0) {
      warnings.push(
        `${s.slug}: ${s.prefixMismatches} sample admission number(s) do not start with ${s.shortName}`
      );
    }
  }
  if (admissionRepair.fixed > 0) {
    warnings.push(
      `Repaired ${admissionRepair.fixed} legacy admission number(s) → SCHOOL/BRANCH/YEAR/####`
    );
  }
  if (capFix.count > 0) {
    warnings.push(
      `Aligned ${capFix.count} STARTER tenant(s) to maxStudents ${PLAN_STUDENT_CAPS.STARTER}`
    );
  }

  const ok =
    schools.length >= 2 &&
    orphanStudents === 0 &&
    orphanStaff === 0 &&
    orphanClasses === 0 &&
    orphanCmsPages === 0 &&
    orphanInvoices === 0 &&
    perSchool.every((s) => s.prefixMismatches === 0);

  return NextResponse.json({
    ok,
    checkedAt: new Date().toISOString(),
    schoolCount: schools.length,
    orphans: {
      students: orphanStudents,
      staff: orphanStaff,
      classes: orphanClasses,
      cmsPages: orphanCmsPages,
      media: orphanMedia,
      notices: orphanNotices,
      invoices: orphanInvoices,
      usersNonPlatform: orphanUsers,
    },
    admissionRepair,
    capFix: { count: capFix.count, maxStudents: PLAN_STUDENT_CAPS.STARTER },
    schools: perSchool,
    warnings,
    checklist: [
      "Work as School A → Students list only A",
      "Work as School B → Students list only B",
      "Reports CSV admission prefixes match school shortName",
      "Fees / Payroll / Leave empty or own data only",
      "CMS pages scoped per school (probe cmsPages count)",
      "Media assets scoped per school",
      "No null schoolId on invoices / CMS / notices",
    ],
  });
}
