import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";

const CreateSchema = z.object({
  category: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  amount: z.coerce.number().positive(),
  date: z.string().optional(),
});

const UpdateSchema = CreateSchema.extend({
  id: z.string().min(1),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_EXPENSES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = await resolveSchoolId(session);
  const url = new URL(req.url);
  const from = url.searchParams.get("from")?.trim() || "";
  const to = url.searchParams.get("to")?.trim() || "";

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const where = {
    ...schoolWhere(schoolId),
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
  };

  const expenses = await prisma.expenseRecord.findMany({
    where,
    orderBy: { date: "desc" },
    take: 1000,
  });

  const incomeAgg = await prisma.payment.aggregate({
    where: {
      status: "SUCCESS",
      ...(schoolId ? { student: { schoolId } } : {}),
    },
    _sum: { amount: true },
  });
  const expenseAgg = await prisma.expenseRecord.aggregate({
    where,
    _sum: { amount: true },
  });

  const income = toMoney(incomeAgg._sum.amount);
  const expenseTotal = toMoney(expenseAgg._sum.amount);

  return NextResponse.json({
    expenses,
    summary: {
      income,
      expenses: expenseTotal,
      net: toMoney(income - expenseTotal),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_EXPENSES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid expense data" }, { status: 400 });
  }

  const schoolIdCreate = await resolveSchoolId(session);
  const exp = await prisma.expenseRecord.create({
    data: {
      schoolId: schoolIdCreate ?? undefined,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      recordedBy: session.userId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "CREATE_EXPENSE",
    entity: "ExpenseRecord",
    entityId: exp.id,
    details: { amount: toMoney(exp.amount), category: exp.category },
  });

  return NextResponse.json({ expense: exp }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_EXPENSES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid expense data" }, { status: 400 });
  }

  const schoolId = await resolveSchoolId(session);
  const existing = await prisma.expenseRecord.findFirst({
    where: { id: parsed.data.id, ...schoolWhere(schoolId) },
  });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const exp = await prisma.expenseRecord.update({
    where: { id: existing.id },
    data: {
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : existing.date,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATE_EXPENSE",
    entity: "ExpenseRecord",
    entityId: exp.id,
    details: { amount: toMoney(exp.amount), category: exp.category },
  });

  return NextResponse.json({ expense: exp });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_EXPENSES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const schoolId = await resolveSchoolId(session);
  const existing = await prisma.expenseRecord.findFirst({
    where: { id: parsed.data.id, ...schoolWhere(schoolId) },
  });
  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await prisma.expenseRecord.delete({ where: { id: existing.id } });

  await logAudit({
    userId: session.userId,
    action: "DELETE_EXPENSE",
    entity: "ExpenseRecord",
    entityId: existing.id,
    details: { amount: toMoney(existing.amount), category: existing.category },
  });

  return NextResponse.json({ ok: true });
}
