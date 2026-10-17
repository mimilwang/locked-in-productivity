import type { FeedActivity, FeedMember } from '../types/feed'

export const FEED_LEAGUE = {
  id: 'league-8am-club',
  name: 'The 8 AM Club',
  currentUserId: 'ac',
}

export const FEED_MEMBERS: FeedMember[] = [
  { id: 'mp', name: 'Maya Patel' },
  { id: 'ac', name: 'Alex Chen' },
  { id: 'jp', name: 'Jay Park' },
  { id: 'nb', name: 'Nia Brooks' },
  { id: 'lm', name: 'Leo Martinez' },
  { id: 'sw', name: 'Sam Wilson' },
]

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString()
}

/** Seed league activity — newest first conceptually; page will sort */
export const SEED_ACTIVITIES: FeedActivity[] = [
  {
    id: 'act-1',
    leagueId: FEED_LEAGUE.id,
    type: 'challenge',
    actor: FEED_MEMBERS[0]!,
    headline: 'banked Buddy workout',
    detail: 'Party-sized daily challenge with Jay',
    points: 50,
    imageUrl:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    createdAt: minutesAgo(12),
    reactions: [
      { emoji: '🔥', userIds: ['ac', 'jp', 'nb'] },
      { emoji: '👏', userIds: ['lm'] },
    ],
  },
  {
    id: 'act-2',
    leagueId: FEED_LEAGUE.id,
    type: 'goal',
    actor: FEED_MEMBERS[2]!,
    headline: 'logged weekly goal progress',
    detail: '3 / 4 gym sessions this week',
    points: 25,
    createdAt: minutesAgo(38),
    reactions: [{ emoji: '🔒', userIds: ['ac', 'mp'] }],
  },
  {
    id: 'act-3',
    leagueId: FEED_LEAGUE.id,
    type: 'streak',
    actor: FEED_MEMBERS[3]!,
    headline: 'hit a 5-day streak',
    detail: 'Showing up before the rest of us. Rude.',
    createdAt: minutesAgo(95),
    reactions: [
      { emoji: '🔥', userIds: ['ac'] },
      { emoji: '💀', userIds: ['sw', 'lm'] },
    ],
  },
  {
    id: 'act-4',
    leagueId: FEED_LEAGUE.id,
    type: 'challenge',
    actor: FEED_MEMBERS[1]!,
    headline: 'banked Quick journal',
    detail: 'Fun-sized daily challenge',
    points: 15,
    createdAt: minutesAgo(140),
    reactions: [{ emoji: '👏', userIds: ['mp', 'nb'] }],
  },
  {
    id: 'act-5',
    leagueId: FEED_LEAGUE.id,
    type: 'lead',
    actor: FEED_MEMBERS[0]!,
    headline: 'took the MVP lead',
    detail: '860 pts · The October race is heating up',
    createdAt: minutesAgo(220),
    reactions: [
      { emoji: '🔥', userIds: ['ac', 'jp', 'nb', 'lm', 'sw'] },
      { emoji: '💀', userIds: ['ac'] },
    ],
  },
  {
    id: 'act-6',
    leagueId: FEED_LEAGUE.id,
    type: 'challenge',
    actor: FEED_MEMBERS[4]!,
    headline: 'banked Buddy walk',
    detail: 'Fun-sized · campus loop with Sam',
    points: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    createdAt: minutesAgo(360),
    reactions: [{ emoji: '👏', userIds: ['sw', 'ac'] }],
  },
  {
    id: 'act-7',
    leagueId: FEED_LEAGUE.id,
    type: 'update',
    actor: FEED_MEMBERS[5]!,
    headline: 'dropped a league update',
    detail: 'Exam week mode — someone drag me to a study sync tomorrow.',
    createdAt: minutesAgo(480),
    reactions: [
      { emoji: '🔒', userIds: ['nb', 'jp'] },
      { emoji: '🔥', userIds: ['ac'] },
    ],
  },
]
