import { addDays } from './weekly-summary';

/**
 * Tantangan hemat bersama Kanto: the streak of days with something recorded,
 * and challenges like "5 of 7 days without Jajan". Progress is worked out
 * from the transactions' dates, so only the challenge is stored
 * (saku.challenges). Pure.
 */

export const MAX_ACTIVE_CHALLENGES = 3;
export const CHALLENGE_LENGTHS = [7, 14, 30] as const;

export interface Challenge {
  id: string;
  /** The expense category watched; null watches all spending. */
  categoryId: string | null;
  lengthDays: number;
  targetDays: number;
  startDate: string;
}

export type ChallengeStatus = 'active' | 'won' | 'lost';
export type ChallengeDay = 'free' | 'slip' | 'today' | 'future';

export interface ChallengeProgress {
  endDate: string;
  /** Days that passed without spending in the category (today once it is over). */
  freeDays: number;
  /** Days with spending in the category, today included. */
  slipDays: number;
  status: ChallengeStatus;
  /** One entry per day of the challenge, first day first. */
  days: ChallengeDay[];
  /** Spent in the category today, within the challenge. */
  slipToday: boolean;
}

/**
 * Days in a row with at least one transaction, up to today. A streak that
 * has not been extended today is still alive until the day is over.
 */
export function recordingStreak(recorded: Set<string>, today: string): { days: number; recordedToday: boolean } {
  const recordedToday = recorded.has(today);
  let day = recordedToday ? today : addDays(today, -1);
  let days = 0;
  while (recorded.has(day)) {
    days++;
    day = addDays(day, -1);
  }
  return { days, recordedToday };
}

/**
 * Where a challenge stands on `today`, given the days with spending in its
 * category. Won as soon as enough days have passed clean, lost as soon as
 * too many have slipped for the target to be reached.
 */
export function challengeProgress(c: Challenge, spent: Set<string>, today: string): ChallengeProgress {
  const endDate = addDays(c.startDate, c.lengthDays - 1);
  const days: ChallengeDay[] = [];
  let freeDays = 0;
  let slipDays = 0;
  for (let i = 0; i < c.lengthDays; i++) {
    const day = addDays(c.startDate, i);
    if (day > today) {
      days.push('future');
    } else if (spent.has(day)) {
      slipDays++;
      days.push('slip');
    } else if (day === today) {
      days.push('today');
    } else {
      freeDays++;
      days.push('free');
    }
  }
  const status: ChallengeStatus =
    freeDays >= c.targetDays ? 'won' : slipDays > c.lengthDays - c.targetDays || today > endDate ? 'lost' : 'active';
  return { endDate, freeDays, slipDays, status, days, slipToday: today <= endDate && spent.has(today) };
}

/** How many slips the challenge can still take, while it is on. */
export function slipsLeft(c: Challenge, p: ChallengeProgress): number {
  return Math.max(0, c.lengthDays - c.targetDays - p.slipDays);
}

/** Kanto's face: cheering a win or a streak kept today, sad about a slip today or a lost challenge. */
export function kantoMood(
  streak: { days: number; recordedToday: boolean },
  challenges: Pick<ChallengeProgress, 'status' | 'slipToday' | 'endDate'>[],
  today: string
): 'cheer' | 'sad' | 'idle' {
  // Finished challenges still count the day after, so the result is seen.
  const recent = challenges.filter((c) => c.status === 'active' || c.endDate >= addDays(today, -1));
  if (recent.some((c) => c.status === 'lost' || (c.status === 'active' && c.slipToday))) return 'sad';
  if (recent.some((c) => c.status === 'won') || (streak.recordedToday && streak.days >= 3)) return 'cheer';
  return 'idle';
}
