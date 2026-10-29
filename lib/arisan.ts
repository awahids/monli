import { addDays } from './weekly-summary';

/**
 * Arisan: every member puts in `amount` each round, and one member in turn
 * takes the whole pot. There are as many rounds as members; round k falls
 * k - 1 weeks or months after the start and goes to the member whose turn
 * is k. Pure: the schedule and who has paid are worked out here.
 */

export type ArisanFrequency = 'weekly' | 'monthly';

export interface ArisanMember {
  id: string;
  name: string;
  turn: number;
  isMe: boolean;
}

export interface ArisanPayment {
  memberId: string;
  round: number;
  paidOn: string;
}

export interface Arisan {
  id: string;
  name: string;
  amount: number;
  frequency: ArisanFrequency;
  startDate: string;
  note?: string | null;
  members: ArisanMember[];
  payments: ArisanPayment[];
}

export interface ArisanRound {
  round: number;
  date: string;
  receiver: ArisanMember | null;
  /** Members who have put in for this round. */
  paid: number;
}

/**
 * The day of round `round` (1-based). Monthly rounds keep the start's day of
 * the month, or the month's last day when it is shorter (31 Jan → 28 Feb).
 */
export function roundDate(start: string, frequency: ArisanFrequency, round: number): string {
  if (frequency === 'weekly') return addDays(start, (round - 1) * 7);
  const [y, m, d] = start.split('-').map(Number);
  const month = new Date(Date.UTC(y, m - 1 + round - 1, 1));
  const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  month.setUTCDate(Math.min(d, lastDay));
  return month.toISOString().slice(0, 10);
}

/** Every round with its date, who takes the pot, and how many have paid. */
export function arisanSchedule(a: Pick<Arisan, 'startDate' | 'frequency' | 'members' | 'payments'>): ArisanRound[] {
  return a.members.map((_, i) => {
    const round = i + 1;
    return {
      round,
      date: roundDate(a.startDate, a.frequency, round),
      receiver: a.members.find((m) => m.turn === round) ?? null,
      paid: a.payments.filter((p) => p.round === round).length,
    };
  });
}

/**
 * The round to look at on `today`: the latest one that has started, the
 * first before the arisan begins. Null once every round is over and paid.
 */
export function currentRound(a: Arisan, today: string): ArisanRound | null {
  const rounds = arisanSchedule(a);
  if (!rounds.length) return null;
  const started = rounds.filter((r) => r.date <= today);
  const round = started.length ? started[started.length - 1] : rounds[0];
  const last = rounds[rounds.length - 1];
  if (round === last && last.date < today && rounds.every((r) => r.paid >= a.members.length)) return null;
  return round;
}

/** What the pot holds each round. */
export const potSize = (a: Pick<Arisan, 'amount' | 'members'>) => a.amount * a.members.length;

export const hasPaid = (a: Pick<Arisan, 'payments'>, memberId: string, round: number) =>
  a.payments.some((p) => p.memberId === memberId && p.round === round);

/** The user's own member in the arisan, when they are in it. */
export const me = (a: Pick<Arisan, 'members'>) => a.members.find((m) => m.isMe) ?? null;

/** Rounds the user has not paid for yet, up to and including today's. */
export function myUnpaidRounds(a: Arisan, today: string): ArisanRound[] {
  const mine = me(a);
  if (!mine) return [];
  return arisanSchedule(a).filter((r) => r.date <= today && !hasPaid(a, mine.id, r.round));
}

/**
 * Reminders for the phone and Web Push (lib/notifications.ts): the user's
 * payment the morning before each coming round they have not paid yet, and
 * their own turn to take the pot on its morning.
 */
export function arisanReminders(
  arisans: Arisan[],
  today: string,
  until: string
): { key: string; kind: 'pay' | 'receive'; arisan: Arisan; round: ArisanRound }[] {
  const out: { key: string; kind: 'pay' | 'receive'; arisan: Arisan; round: ArisanRound }[] = [];
  for (const a of arisans) {
    const mine = me(a);
    if (!mine) continue;
    for (const r of arisanSchedule(a)) {
      if (r.date < today || r.date > until) continue;
      if (r.receiver?.id === mine.id) out.push({ key: `arisan:${a.id}:${r.round}:receive`, kind: 'receive', arisan: a, round: r });
      else if (!hasPaid(a, mine.id, r.round)) out.push({ key: `arisan:${a.id}:${r.round}:pay`, kind: 'pay', arisan: a, round: r });
    }
  }
  return out;
}

/** A fair draw of the turns (kocok), Fisher–Yates with the given random source. */
export function shuffleTurns<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
