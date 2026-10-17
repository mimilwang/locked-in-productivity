export type UserProfile = {
  id: number
  name: string
  displayName: string
  email: string | null
  photoUrl: string | null
  timeZone: string
  currentStreak: number
  bestStreak: number
  badges: string[]
  titles: Array<{
    title: 'MVP' | 'CHUD'
    leagueId: number
    leagueName: string
    month: string
  }>
}

export type AuthResponse = {
  token: string
  user: UserProfile
}

export type ApiErrorBody = {
  status?: number
  error?: string
  message?: string
  timestamp?: string
}
