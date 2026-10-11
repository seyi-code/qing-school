import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendSms } from "@/lib/integrations/messaging";
import { formatNaira } from "@/lib/format";
import { extractPhone } from "@/lib/phone";
import { toMoney } from "@/lib/money";
import { resolveSchoolId } from "@/lib/tenant-scope";

export async function POST() {
  const session = await getSession();
  if (!session || !["ADMIN", "ACCOUNTANT", "SECRETARY", "PLATFORM_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = await resolveSchoolId(session);
  const school = schoolId
    ? await prisma.school.findUnique({ where: { id: schoolId }, select: { shortName: true } })
    : null;
  const tag = school?.shortName || "School";

  const unpaid = await prisma.invoice.findMany({
    where: {
      status: { in: ["UNPAID", "PARTIAL"] },
      ...(schoolId ? { student: { schoolId } } : {}),
    },
    include: { student: true },
    take: 100,
  });

  let sent = 0;
  let skipped = 0;
  const debtors = unpaid.length;

  for (const inv of unpaid) {
    const phone = extractPhone(inv.student.guardianPhone, inv.student.medicalNotes);
    if (!phone) {
      skipped++;
      continue;
    }
    const bal = toMoney(toMoney(inv.totalAmount) - toMoney(inv.amountPaid));
    const body = `${tag}: Fee reminder for ${inv.student.firstName}. Balance ${formatNaira(bal)}. Please pay at the office or online portal.`;
    const result = await sendSms({ to: phone, body });
    if (result.ok) sent++;
    else skipped++;
  }

  return NextResponse.json({
    message: `Reminders: ${sent} sent, ${skipped} skipped (no phone / SMS failed).`,
    debtors,
    sent,
    skippedNoPhoneOrFailed: skipped,
  });
}
