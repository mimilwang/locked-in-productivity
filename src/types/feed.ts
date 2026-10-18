export type ReactionEmoji = '🔥' | '👏' | '💀' | '🔒'

export type ActivityType =
  | 'challenge'
  | 'streak'
  | 'goal'
  | 'lead'
  | 'update'
  | 'session'

export interface FeedMember {
  id: string
  name: string
}

export interface ActivityReaction {
  emoji: ReactionEmoji
  /** Member ids who reacted with this emoji */
  userIds: string[]
}

export interface FeedReply {
  id: string
  actor: FeedMember
  body: string
  createdAt: string
}

export interface FeedActivity {
  id: string
  leagueId: string
  type: ActivityType
  actor: FeedMember
  /** Short action line, e.g. "banked Buddy workout" */
  headline: string
  detail?: string
  points?: number
  imageUrl?: string
  createdAt: string
  reactions: ActivityReaction[]
  replies?: FeedReply[]
}
