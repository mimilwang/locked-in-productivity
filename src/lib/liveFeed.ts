import type { FeedActivity, ReactionEmoji } from '../types/feed'

const STORAGE_KEY = 'locked-in:live-feed:v1'

type FeedStore = {
  /** User-authored posts + any seed overrides by id */
  extras: FeedActivity[]
  /** Reaction map keyed by activity id */
  reactions: Record<string, FeedActivity['reactions']>
}

function emptyStore(): FeedStore {
  return { extras: [], reactions: {} }
}

export function loadFeedStore(): FeedStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as FeedStore
    return {
      extras: Array.isArray(parsed.extras) ? parsed.extras : [],
      reactions:
        parsed.reactions && typeof parsed.reactions === 'object'
          ? parsed.reactions
          : {},
    }
  } catch {
    return emptyStore()
  }
}

function saveFeedStore(store: FeedStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/**
 * Real activity (`base`, built from the league's logs) + posts made on this device,
 * with saved reactions applied, newest first. No sample data: an empty league shows an empty feed.
 */
export function getFeedActivities(leagueId: string, base: FeedActivity[] = []): FeedActivity[] {
  const store = loadFeedStore()
  const byId = new Map<string, FeedActivity>()

  for (const item of base) {
    if (item.leagueId !== leagueId) continue
    byId.set(item.id, {
      ...item,
      reactions: store.reactions[item.id] ?? item.reactions,
    })
  }

  for (const extra of store.extras) {
    if (extra.leagueId !== leagueId) continue
    byId.set(extra.id, {
      ...extra,
      reactions: store.reactions[extra.id] ?? extra.reactions,
    })
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function toggleReaction(
  activityId: string,
  userId: string,
  emoji: ReactionEmoji,
  leagueId: string,
  base: FeedActivity[] = [],
): FeedActivity[] {
  const store = loadFeedStore()
  const activities = getFeedActivities(leagueId, base)
  const activity = activities.find((a) => a.id === activityId)
  if (!activity) return activities

  const current = structuredClone(
    store.reactions[activityId] ?? activity.reactions,
  )

  let bucket = current.find((r) => r.emoji === emoji)
  if (!bucket) {
    bucket = { emoji, userIds: [] }
    current.push(bucket)
  }

  if (bucket.userIds.includes(userId)) {
    bucket.userIds = bucket.userIds.filter((id) => id !== userId)
  } else {
    // One reaction type at a time per user keeps the MVP simple
    for (const r of current) {
      r.userIds = r.userIds.filter((id) => id !== userId)
    }
    bucket.userIds.push(userId)
  }

  store.reactions[activityId] = current.filter((r) => r.userIds.length > 0)
  saveFeedStore(store)
  return getFeedActivities(leagueId, base)
}

export function addFeedPost(input: {
  leagueId: string
  actorId: string
  actorName: string
  detail: string
  imageUrl?: string
}, base: FeedActivity[] = []): FeedActivity[] {
  const store = loadFeedStore()
  const post: FeedActivity = {
    id: `act-user-${Date.now()}`,
    leagueId: input.leagueId,
    type: 'update',
    actor: { id: input.actorId, name: input.actorName },
    headline: 'dropped a league update',
    detail: input.detail.trim(),
    imageUrl: input.imageUrl,
    createdAt: new Date().toISOString(),
    reactions: [],
  }
  store.extras = [post, ...store.extras]
  saveFeedStore(store)
  return getFeedActivities(input.leagueId, base)
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diffMs = Math.max(0, now - new Date(iso).getTime())
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
