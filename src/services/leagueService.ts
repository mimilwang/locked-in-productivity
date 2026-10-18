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

export async function getMyLeagues() {
  const leagues = await apiRequest<League[]>('/leagues')
  const activeId = getActiveLeagueId()
  const activeLeague = leagues.find((league) => league.id === activeId) ?? leagues[0] ?? null
  if (activeLeague) {
    setActiveLeague(activeLeague)
  } else {
    window.localStorage.removeItem(ACTIVE_LEAGUE_KEY)
    window.localStorage.removeItem(ACTIVE_LEAGUE_DATA_KEY)
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
