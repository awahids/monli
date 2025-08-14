import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

const querySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid from month format'),
  to: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid to month format'),
});

export async function GET(req: Request) {
  try {
    const user = await getUser();
    const { searchParams } = new URL(req.url);
    const parse = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'invalid query' },
        { status: 400 }
      );
    }
    const { from, to } = parse.data;
    const fromDate = new Date(`${from}-01T00:00:00.000Z`);
    const toDate = new Date(`${to}-01T00:00:00.000Z`);

    const months: string[] = [];
    let cur = new Date(fromDate);
    while (cur <= toDate && months.length < 12) {
      months.push(
        `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}`
      );
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    }
    if (months.length === 0 || toDate < fromDate) {
      return NextResponse.json({ error: 'invalid range' }, { status: 400 });
    }
    if (
      toDate >= new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 12, 1))
    ) {
      return NextResponse.json({ error: 'range too large (max 12 months)' }, { status: 400 });
    }
    const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() + 1, 1));

    const data = await prisma.transaction.findMany({
      where: {
        userId: user.sub,
        date: { gte: fromDate, lt: end },
      },
      select: { date: true, type: true, amount: true },
    });

    const result = months.map(m => ({ month: m, income: 0, expense: 0 }));
    const index = new Map(result.map((r, i) => [r.month, i]));
    data.forEach(tx => {
      const d = new Date(tx.date);
      const m = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const idx = index.get(m);
      if (idx !== undefined) {
        if (tx.type === 'income') result[idx].income += Number(tx.amount);
        else if (tx.type === 'expense') result[idx].expense += Number(tx.amount);
      }
    });

    return NextResponse.json({ data: result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

