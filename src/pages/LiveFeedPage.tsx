import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  addFeedPost,
  formatRelativeTime,
  getFeedActivities,
  toggleReaction,
} from '../lib/liveFeed'
import type { FeedActivity, ReactionEmoji } from '../types/feed'
import './LiveFeedPage.css'
import AppSidebar from '../components/AppSidebar'
import { cachedUser } from '../services/authService'
import { getCachedLeague, getLeagueLogs, getLeagueMembers } from '../services/leagueService'
import type { League, LeagueMember, ProgressLog } from '../services/leagueService'

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
}: {
  activity: FeedActivity
  currentUserId: string
  currentUserName: string
  onReact: (activityId: string, emoji: ReactionEmoji) => void
}) {
  const myReaction = activity.reactions.find((r) =>
    r.userIds.includes(currentUserId),
  )?.emoji
  const actorName = activity.actor.id === currentUserId ? currentUserName : activity.actor.name

  return (
    <article className="lf-card">
      <header className="lf-card__header">
        <div className="lf-avatar" aria-hidden>
          {initials(actorName)}
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
          <img src={activity.imageUrl} alt="" />
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
              onClick={() => onReact(activity.id, emoji)}
            >
              <span aria-hidden>{emoji}</span>
              {count > 0 ? <span>{count}</span> : null}
            </button>
          )
        })}
      </div>
    </article>
  )
}

/** Turn the league's finished logs into feed items. */
function logsToActivities(logs: ProgressLog[], members: LeagueMember[], league: League): FeedActivity[] {
  return logs
    .filter((log) => !log.running)
    .map((log) => {
      const actorName =
        members.find((m) => m.userId === log.userId)?.displayName ?? 'A member'
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
          actor: { id: String(log.userId), name: actorName },
          headline: `completed “${title}”`,
          detail: buddyName
            ? `with ${buddyName}`
            : log.note ?? undefined,
          points: pts > 0 ? pts : undefined,
          createdAt: log.endedAt ?? log.startedAt,
          reactions: [],
        }
      }

      return {
        id: `log-${log.id}`,
        leagueId: String(league.id),
        type: 'session' as const,
        actor: { id: String(log.userId), name: actorName },
        headline:
          league.goalType === 'TIME'
            ? `logged ${log.durationMinutes} minutes`
            : 'completed a task',
        detail: log.note ?? undefined,
        createdAt: log.endedAt ?? log.startedAt,
        reactions: [],
      }
    })
}

export default function LiveFeedPage() {
  const me = useMemo(() => {
    const user = cachedUser()
    return user ? { id: String(user.id), name: user.displayName || user.name } : { id: 'me', name: 'You' }
  }, [])
  const league = useMemo(() => getCachedLeague(), [])
  const feedId = league ? String(league.id) : 'no-league'

  const [logActivities, setLogActivities] = useState<FeedActivity[]>([])
  const [activities, setActivities] = useState<FeedActivity[]>(() => getFeedActivities(feedId))

  // Pull the league's real activity from the backend.
  const refresh = useCallback(async () => {
    if (!league) return
    try {
      const [logs, members] = await Promise.all([getLeagueLogs(league.id), getLeagueMembers(league.id)])
      const fromLogs = logsToActivities(logs, members, league)
      setLogActivities(fromLogs)
      setActivities(getFeedActivities(feedId, fromLogs))
    } catch {
      // backend unreachable: keep whatever is showing
    }
  }, [league, feedId])

  useEffect(() => {
    void refresh()
  }, [refresh])
  const [draft, setDraft] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [livePulse, setLivePulse] = useState(0)

  // Soft "live" refresh while the tab is open
  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh()
      setLivePulse((n) => n + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [refresh])

  function handleReact(activityId: string, emoji: ReactionEmoji) {
    setActivities(
      toggleReaction(activityId, me.id, emoji, feedId, logActivities),
    )
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(URL.createObjectURL(file))
    setPhotoName(file.name)
  }

  function clearPhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setPhotoName('')
  }

  function handleCompose(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    setActivities(
      addFeedPost(
        {
          leagueId: feedId,
          actorId: me.id,
          actorName: me.name,
          detail: draft,
          imageUrl: photoUrl ?? undefined,
        },
        logActivities,
      ),
    )
    setDraft('')
    // Keep object URL alive inside the saved post; clear composer refs only
    setPhotoUrl(null)
    setPhotoName('')
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

          <form className="lf-composer" onSubmit={handleCompose}>
            <div className="lf-composer__row">
              <div className="lf-avatar lf-avatar--me" aria-hidden>
                {initials(me.name)}
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
                    <img src={photoUrl} alt="" />
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
                    disabled={!draft.trim()}
                  >
                    Post to feed <span aria-hidden>→</span>
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
              />
            ))}
          </section>
        </main>

        <footer className="lf-footer">
          <span>League-private · Reactions sync on this device for the MVP</span>
          <span>{activities.length} updates</span>
        </footer>
      </div>
    </div>
  )
}
