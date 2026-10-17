export type ChallengeSize = 'fun' | 'party'

export type ChallengeCategory =
  | 'social'
  | 'wellness'
  | 'mindfulness'
  | 'activity'

export interface Challenge {
  id: string
  title: string
  description: string
  size: ChallengeSize
  points: number
  category: ChallengeCategory
  requiresBuddy: boolean
}

export interface DailyChallengePair {
  dateKey: string
  fun: Challenge
  party: Challenge
}

export interface ChallengeCompletion {
  challengeId: string
  completedAt: string
  note?: string
}
