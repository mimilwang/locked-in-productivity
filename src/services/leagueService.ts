import { apiRequest } from './apiClient'

export type League = {
  id: number
  name: string
  goalDescription: string
  goalType: 'TIME' | 'TASKS'
  weeklyTarget: number
  startDate: string
  endDate: string
  inviteCode: string
  photoUrl: string | null
  reward: string
  punishment: string
  creatorId: number
  memberCount: number
  readyToStart: boolean
  myRole: 'OWNER' | 'MEMBER' | null
}

export type LeaderboardEntry = {
  rank: number
  userId: number
  displayName: string
  avatarUrl: string | null
  points: number
  weeklyPercent: number
  minutes: number
  tasks: number
  streak: number
  standing: 'LEADER' | 'CHUD_ZONE' | 'NONE'
}

export type LeagueOverviewData = {
  leagueId: number
  leagueName: string
  goalDescription: string
  goalType: 'TIME' | 'TASKS'
  weeklyTarget: number
  weekStart: string
  weekEnd: string
  todaysLeader: LeaderboardEntry | null
  weeklyLeaderboard: LeaderboardEntry[]
  totalMinutesThisWeek: number
  membersHitWeeklyGoal: number
  memberCount: number
  groupGoalProgress: number
  myWeeklyProgress: number
  daysLeft: number
}

export type LeagueMember = {
  userId: number
  displayName: string
  avatarUrl: string | null
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

export type ProgressLog = {
  id: number
  userId: number
  leagueId: number
  startedAt: string
  endedAt: string | null
  durationMinutes: number
  source: 'TIMER' | 'MANUAL'
  localDate: string
  note: string | null
  running: boolean
  title: string | null
  photoUrls: string[]
  challengeId: string | null
  bonusPoints: number
}

const ACTIVE_LEAGUE_KEY = 'locked-in:active-league-id'
const ACTIVE_LEAGUE_DATA_KEY = 'locked-in:active-league'

export function getActiveLeagueId() {
  const stored = window.localStorage.getItem(ACTIVE_LEAGUE_KEY)
  return stored ? Number(stored) : null
}

export function getCachedLeague(): League | null {
  try {
    const stored = window.localStorage.getItem(ACTIVE_LEAGUE_DATA_KEY)
    return stored ? JSON.parse(stored) as League : null
  } catch {
    return null
  }
}

export function setActiveLeague(league: League) {
  window.localStorage.setItem(ACTIVE_LEAGUE_KEY, String(league.id))
  window.localStorage.setItem(ACTIVE_LEAGUE_DATA_KEY, JSON.stringify(league))
  window.dispatchEvent(new CustomEvent('locked-in:active-league-changed', { detail: league }))
}

export function clearActiveLeague() {
  window.localStorage.removeItem(ACTIVE_LEAGUE_KEY)
  window.localStorage.removeItem(ACTIVE_LEAGUE_DATA_KEY)
  window.dispatchEvent(new CustomEvent('locked-in:active-league-changed', { detail: null }))
}

export async function getMyLeagues() {
  const leagues = await apiRequest<League[]>('/leagues')
  const activeId = getActiveLeagueId()
  const activeLeague = leagues.find((league) => league.id === activeId) ?? null
  if (activeLeague) {
    setActiveLeague(activeLeague)
  } else if (activeId !== null) {
    clearActiveLeague()
  }
  return leagues
}

export async function createLeague(input: {
  name: string
  goalDescription: string
  goalType: 'TIME' | 'TASKS'
  weeklyTarget: number
  durationWeeks: number
  reward: string
  punishment: string
}) {
  const league = await apiRequest<League>('/leagues', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setActiveLeague(league)
  return league
}

export async function joinLeague(inviteCode: string) {
  const league = await apiRequest<League>('/leagues/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, agreedToRules: true }),
  })
  setActiveLeague(league)
  return league
}

export function getLeagueOverview(leagueId: number) {
  return apiRequest<LeagueOverviewData>(`/leagues/${leagueId}/overview`)
}

export function getLeagueMembers(leagueId: number) {
  return apiRequest<LeagueMember[]>(`/leagues/${leagueId}/members`)
}

export function getLeagueLogs(leagueId: number, userId?: number) {
  const query = userId ? `?userId=${userId}` : ''
  return apiRequest<ProgressLog[]>(`/leagues/${leagueId}/logs${query}`)
}

// ---------- Leaderboards ----------

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'total'

export function getLeaderboard(leagueId: number, period: LeaderboardPeriod) {
  return apiRequest<LeaderboardEntry[]>(`/leagues/${leagueId}/leaderboard?period=${period}`)
}

// ---------- Monthly results (MVP + Chud) ----------

export type MonthlyResult = {
  leagueId: number
  month: string // "yyyy-MM"
  mvp: LeaderboardEntry | null
  chud: LeaderboardEntry | null
  reward: string
  punishment: string
  standings: LeaderboardEntry[]
  finalizedAt: string | null
}

/** Finalized results for a month, or null if that month hasn't been crowned yet. */
export async function getMonthlyResult(leagueId: number, month: string): Promise<MonthlyResult | null> {
  try {
    return await apiRequest<MonthlyResult>(`/leagues/${leagueId}/monthly/${month}`)
  } catch {
    return null
  }
}
