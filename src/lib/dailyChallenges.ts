import { FUN_CHALLENGES, PARTY_CHALLENGES } from '../data/challengePool'
import type {
  Challenge,
  ChallengeCompletion,
  DailyChallengePair,
} from '../types/challenges'

const STORAGE_PREFIX = 'locked-in:daily-challenges'

/** Local calendar date key YYYY-MM-DD */
export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Deterministic hash so the same league sees the same pair each day */
function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function pickFromPool(
  pool: Challenge[],
  seed: string,
  offset: number,
): Challenge {
  const index = (hashString(seed) + offset) % pool.length
  return pool[index]!
}

/**
 * League-scoped daily pair: one fun-sized + one party-sized.
 * Same date + leagueId always returns the same challenges.
 */
export function getDailyChallenges(
  leagueId: string,
  date: Date = new Date(),
): DailyChallengePair {
  const dateKey = getDateKey(date)
  const seed = `${leagueId}:${dateKey}`

  return {
    dateKey,
    fun: pickFromPool(FUN_CHALLENGES, seed, 0),
    party: pickFromPool(PARTY_CHALLENGES, seed, 17),
  }
}

export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

function storageKey(leagueId: string, dateKey: string): string {
  return `${STORAGE_PREFIX}:${leagueId}:${dateKey}`
}

export function loadCompletions(
  leagueId: string,
  dateKey: string,
): ChallengeCompletion[] {
  try {
    const raw = localStorage.getItem(storageKey(leagueId, dateKey))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChallengeCompletion[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCompletions(
  leagueId: string,
  dateKey: string,
  completions: ChallengeCompletion[],
): void {
  localStorage.setItem(
    storageKey(leagueId, dateKey),
    JSON.stringify(completions),
  )
}

export function totalPointsFromCompletions(
  completions: ChallengeCompletion[],
  pair: DailyChallengePair,
): number {
  const byId = new Map<string, Challenge>([
    [pair.fun.id, pair.fun],
    [pair.party.id, pair.party],
  ])
  return completions.reduce((sum, c) => {
    const challenge = byId.get(c.challengeId)
    return sum + (challenge?.points ?? 0)
  }, 0)
}
