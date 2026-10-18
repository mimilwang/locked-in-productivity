import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { formatRelativeTime } from '../lib/liveFeed'
import type { FeedActivity, ReactionEmoji } from '../types/feed'
import './LiveFeedPage.css'
import AppSidebar from '../components/AppSidebar'
import { cachedUser } from '../services/authService'
import { getCachedLeague, getLeagueLogs, getLeagueMembers } from '../services/leagueService'
import type { League, LeagueMember, ProgressLog } from '../services/leagueService'
import { apiRequest } from '../services/apiClient'
import { createFeedPost, createFeedReply, getFeed, toggleFeedReaction } from '../services/feedService'
import type { FeedStateDto } from '../services/feedService'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080'
const imageSrc = (url: string) => (url.startsWith('http') ? url : `${API_URL}${url}`)

const REACTION_OPTIONS: ReactionEmoji[] = ['🔥', '👏', '💀', '🔒']

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function typeLabel(type: FeedActivity['type']) {
  switch (type) {
    case 'challenge':
      return 'Challenge'
    case 'streak':
      return 'Streak'
    case 'goal':
      return 'Goal'
    case 'lead':
      return 'Race'
    case 'session':
      return 'Session'
    default:
      return 'Update'
  }
}

function ActivityCard({
  activity,
  currentUserId,
  currentUserName,
  onReact,
  onReply,
}: {
  activity: FeedActivity
  currentUserId: string
  currentUserName: string
  onReact: (activityId: string, emoji: ReactionEmoji) => Promise<void>
  onReply: (activityId: string, body: string) => Promise<void>
}) {
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)
  const myReaction = activity.reactions.find((r) =>
    r.userIds.includes(currentUserId),
  )?.emoji
  const actorName = activity.actor.id === currentUserId ? currentUserName : activity.actor.name

  return (
    <article className="lf-card">
      <header className="lf-card__header">
        <div className="lf-avatar" aria-hidden>
          {activity.actor.avatarUrl ? <img src={imageSrc(activity.actor.avatarUrl)} alt="" /> : initials(actorName)}
        </div>
        <div className="lf-card__meta">
          <p className="lf-card__who">
            <strong>{actorName}</strong> {activity.headline}
          </p>
          <p className="lf-card__when">
            <span className="lf-type">{typeLabel(activity.type)}</span>
            <span aria-hidden>·</span>
            <time dateTime={activity.createdAt}>
              {formatRelativeTime(activity.createdAt)}
            </time>
            {typeof activity.points === 'number' ? (
              <>
                <span aria-hidden>·</span>
                <span className="lf-points">+{activity.points} pts</span>
              </>
            ) : null}
          </p>
        </div>
      </header>

      {activity.detail ? (
        <p className="lf-card__detail">{activity.detail}</p>
      ) : null}

      {activity.imageUrl ? (
        <div className="lf-card__photo">
          <img src={imageSrc(activity.imageUrl)} alt="" />
        </div>
      ) : null}

      <div className="lf-reactions" role="group" aria-label="Reactions">
        {REACTION_OPTIONS.map((emoji) => {
          const bucket = activity.reactions.find((r) => r.emoji === emoji)
          const count = bucket?.userIds.length ?? 0
          const active = myReaction === emoji
          return (
            <button
              key={emoji}
              type="button"
              className={`lf-reaction ${active ? 'lf-reaction--active' : ''}`}
              aria-pressed={active}
              onClick={() => void onReact(activity.id, emoji)}
            >
              <span aria-hidden>{emoji}</span>
              {count > 0 ? <span>{count}</span> : null}
            </button>
          )
        })}
      </div>

      <div className="lf-replies">
        {(activity.replies ?? []).map((item) => (
          <div className="lf-reply" key={item.id}>
            <span className="lf-reply__avatar" aria-hidden>{item.actor.avatarUrl ? <img src={imageSrc(item.actor.avatarUrl)} alt="" /> : initials(item.actor.name)}</span>
            <p><strong>{item.actor.id === currentUserId ? currentUserName : item.actor.name}</strong> {item.body}<small>{formatRelativeTime(item.createdAt)}</small></p>
          </div>
        ))}
        <form className="lf-reply-form" onSubmit={async (event) => {
          event.preventDefault()
          if (!reply.trim() || replying) return
          setReplying(true)
          try {
            await onReply(activity.id, reply.trim())
            setReply('')
          } finally {
            setReplying(false)
          }
        }}>
          <input value={reply} onChange={(event) => setReply(event.target.value)} maxLength={280} placeholder="Write a reply…" aria-label="Write a reply" />
          <button type="submit" disabled={!reply.trim() || replying}>{replying ? 'Sending…' : 'Reply'}</button>
        </form>
      </div>
    </article>
  )
}

/** Turn the league's finished logs into feed items. */
function logsToActivities(logs: ProgressLog[], members: LeagueMember[], league: League): FeedActivity[] {
  return logs
    .filter((log) => !log.running)
    .map((log) => {
      const actor = members.find((m) => m.userId === log.userId)
      const actorName = actor?.displayName ?? 'A member'
      const buddyName = log.buddyUserId
        ? members.find((m) => m.userId === log.buddyUserId)?.displayName
        : undefined

      if (log.source === 'CHALLENGE') {
        const title = log.title?.trim() || 'a daily challenge'
        const pts = log.bonusPoints ?? 0
        return {
          id: `log-${log.id}`,
          leagueId: String(league.id),
          type: 'challenge' as const,
          actor: { id: String(log.userId), name: actorName, avatarUrl: actor?.avatarUrl ?? undefined },
          headline: `completed “${title}”`,
          detail: buddyName
            ? `with ${buddyName}`
            : log.note ?? undefined,
          points: pts > 0 ? pts : undefined,
          createdAt: log.endedAt ?? log.startedAt,
          reactions: [],
          replies: [],
        }
      }

      return {
        id: `log-${log.id}`,
        leagueId: String(league.id),
        type: 'session' as const,
        actor: { id: String(log.userId), name: actorName, avatarUrl: actor?.avatarUrl ?? undefined },
        headline:
          league.goalType === 'TIME'
            ? `logged ${log.durationMinutes} minutes`
            : 'completed a task',
        detail: log.note ?? undefined,
        createdAt: log.endedAt ?? log.startedAt,
        reactions: [],
        replies: [],
      }
    })
}

function combineFeed(base: FeedActivity[], state: FeedStateDto, leagueId: number, members: LeagueMember[]): FeedActivity[] {
  const posts: FeedActivity[] = state.posts.map((post) => ({
    id: post.id,
    leagueId: String(leagueId),
    type: 'update',
    actor: { id: String(post.userId), name: post.displayName, avatarUrl: members.find((member) => member.userId === post.userId)?.avatarUrl ?? undefined },
    headline: 'dropped a league update',
    detail: post.body,
    imageUrl: post.imageUrl ?? undefined,
    createdAt: post.createdAt,
    reactions: [],
    replies: [],
  }))
  return [...base, ...posts].map((activity) => {
    const grouped = new Map<ReactionEmoji, string[]>()
    state.reactions.filter((item) => item.activityId === activity.id).forEach((item) => {
      grouped.set(item.emoji, [...(grouped.get(item.emoji) ?? []), String(item.userId)])
    })
    return {
      ...activity,
      reactions: [...grouped].map(([emoji, userIds]) => ({ emoji, userIds })),
      replies: state.replies.filter((item) => item.activityId === activity.id).map((item) => ({
        id: String(item.id),
        actor: { id: String(item.userId), name: item.displayName, avatarUrl: members.find((member) => member.userId === item.userId)?.avatarUrl ?? undefined },
        body: item.body,
        createdAt: item.createdAt,
      })),
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export default function LiveFeedPage() {
  const me = useMemo(() => {
    const user = cachedUser()
    return user ? { id: String(user.id), name: user.displayName || user.name, avatarUrl: user.photoUrl ?? undefined } : { id: 'me', name: 'You', avatarUrl: undefined }
  }, [])
  const league = useMemo(() => getCachedLeague(), [])
  const [activities, setActivities] = useState<FeedActivity[]>([])
  const [error, setError] = useState('')

  // Pull the league's real activity from the backend.
  const refresh = useCallback(async () => {
    if (!league) return
    try {
      const [logs, members, feed] = await Promise.all([getLeagueLogs(league.id), getLeagueMembers(league.id), getFeed(league.id)])
      const fromLogs = logsToActivities(logs, members, league)
      setActivities(combineFeed(fromLogs, feed, league.id, members))
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not refresh the live feed.')
    }
  }, [league])

  useEffect(() => {
    void refresh()
  }, [refresh])
  const [draft, setDraft] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [livePulse, setLivePulse] = useState(0)

  // Soft "live" refresh while the tab is open
  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh()
      setLivePulse((n) => n + 1)
    }, 5_000)
    return () => window.clearInterval(id)
  }, [refresh])

  async function handleReact(activityId: string, emoji: ReactionEmoji) {
    if (!league) return
    try {
      await toggleFeedReaction(league.id, activityId, emoji)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save reaction.')
    }
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const uploaded = await apiRequest<{ url: string }>('/images', { method: 'POST', body: form })
      setPhotoUrl(uploaded.url)
      setPhotoName(file.name)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload that photo.')
    } finally {
      setUploading(false)
    }
  }

  function clearPhoto() {
    setPhotoUrl(null)
    setPhotoName('')
  }

  async function handleCompose(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim() || !league) return
    setPosting(true)
    setError('')
    try {
      await createFeedPost(league.id, draft.trim(), photoUrl ?? undefined)
      setDraft('')
      setPhotoUrl(null)
      setPhotoName('')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not post to the feed.')
    } finally {
      setPosting(false)
    }
  }

  async function handleReply(activityId: string, body: string) {
    if (!league) return
    try {
      await createFeedReply(league.id, activityId, body)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not post reply.')
      throw caught
    }
  }

  return (
    <div className="lf-page">
      <AppSidebar active="feed" />

      <div className="lf-main">
        <header className="lf-topbar">
          <span>
            Your leagues / {league?.name || 'Your league'} / Live feed
          </span>
        </header>

        <main className="lf-content">
          <div className="lf-heading-row">
            <div>
              <p className="lf-eyebrow">{league?.name || 'Your league'} / Activity</p>
              <h1 className="lf-title">The league never sleeps.</h1>
              <p className="lf-subtitle">
                See who&apos;s logging, reacting, and showing receipts — then
                jump in.
              </p>
            </div>
            <span className="lf-live" key={livePulse}>
              <span className="lf-live-dot" aria-hidden /> Live
            </span>
          </div>

          {error && <div className="lf-error" role="alert">{error}</div>}

          <form className="lf-composer" onSubmit={handleCompose}>
            <div className="lf-composer__row">
              <div className="lf-avatar lf-avatar--me" aria-hidden>
                {me.avatarUrl ? <img src={imageSrc(me.avatarUrl)} alt="" /> : initials(me.name)}
              </div>
              <div className="lf-composer__body">
                <label className="lf-visually-hidden" htmlFor="feed-update">
                  League update
                </label>
                <textarea
                  id="feed-update"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Hype the crew, call someone out gently, or share a win…"
                  rows={3}
                  maxLength={280}
                />
                {photoUrl ? (
                  <div className="lf-composer__preview">
                    <img src={imageSrc(photoUrl)} alt="" />
                    <button type="button" onClick={clearPhoto}>
                      Remove photo
                    </button>
                  </div>
                ) : null}
                <div className="lf-composer__actions">
                  <label className="lf-upload">
                    Add photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhoto}
                    />
                  </label>
                  <span className="lf-composer__hint">
                    {photoName || 'Optional proof · JPG/PNG/WebP'}
                  </span>
                  <button
                    type="submit"
                    className="lf-submit"
                    disabled={!draft.trim() || posting || uploading}
                  >
                    {posting ? 'Posting…' : uploading ? 'Uploading…' : 'Post to feed'} <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          <section className="lf-stream" aria-label="League activity">
            {activities.length === 0 && (
              <p className="lf-empty">
                No activity yet. When your league logs sessions or posts updates, they&apos;ll show up here.
              </p>
            )}
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                currentUserId={me.id}
                currentUserName={me.name}
                onReact={handleReact}
                onReply={handleReply}
              />
            ))}
          </section>
        </main>

        <footer className="lf-footer">
          <span>League-private · Posts, reactions, and replies sync across devices</span>
          <span>{activities.length} updates</span>
        </footer>
      </div>
    </div>
  )
}
