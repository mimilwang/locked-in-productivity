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

const ACTIVE_LEAGUE_KEY = 'locked-in:active-league-id'

export function getActiveLeagueId() {
  const stored = window.localStorage.getItem(ACTIVE_LEAGUE_KEY)
  return stored ? Number(stored) : null
}

export async function getMyLeague() {
  const leagues = await apiRequest<League[]>('/leagues')
  const league = leagues[0] ?? null
  if (league) window.localStorage.setItem(ACTIVE_LEAGUE_KEY, String(league.id))
  else window.localStorage.removeItem(ACTIVE_LEAGUE_KEY)
  return league
}

export async function joinLeague(inviteCode: string) {
  const league = await apiRequest<League>('/leagues/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, agreedToRules: true }),
  })
  window.localStorage.setItem(ACTIVE_LEAGUE_KEY, String(league.id))
  return league
}
