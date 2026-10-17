import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { FEED_LEAGUE, FEED_MEMBERS } from '../data/feedMock'
import {
  addFeedPost,
  formatRelativeTime,
  getFeedActivities,
  toggleReaction,
} from '../lib/liveFeed'
import type { FeedActivity, ReactionEmoji } from '../types/feed'
import './LiveFeedPage.css'

const NAV_ITEMS = [
  'Overview',
  'Daily check-in',
  'Live feed',
  'Leaderboard',
  'Monthly awards',
  'Dare wheel',
]

const NAV_ROUTES: Record<string, string> = {
  Overview: '/overview',
  'Daily check-in': '/timer',
  'Live feed': '/feed',
  Leaderboard: '/leaderboard',
  'Monthly awards': '/monthly-awards',
  'Dare wheel': '/daily-challenges',
}

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
    default:
      return 'Update'
  }
}

function ActivityCard({
  activity,
  currentUserId,
  onReact,
}: {
  activity: FeedActivity
  currentUserId: string
  onReact: (activityId: string, emoji: ReactionEmoji) => void
}) {
  const myReaction = activity.reactions.find((r) =>
    r.userIds.includes(currentUserId),
  )?.emoji

  return (
    <article className="lf-card">
      <header className="lf-card__header">
        <div className="lf-avatar" aria-hidden>
          {initials(activity.actor.name)}
        </div>
        <div className="lf-card__meta">
          <p className="lf-card__who">
            <strong>{activity.actor.name}</strong> {activity.headline}
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

export default function LiveFeedPage() {
  const me = useMemo(
    () => FEED_MEMBERS.find((m) => m.id === FEED_LEAGUE.currentUserId)!,
    [],
  )

  const [activities, setActivities] = useState<FeedActivity[]>(() =>
    getFeedActivities(FEED_LEAGUE.id),
  )
  const [draft, setDraft] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [livePulse, setLivePulse] = useState(0)

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Soft "live" refresh while the tab is open
  useEffect(() => {
    const id = window.setInterval(() => {
      setActivities(getFeedActivities(FEED_LEAGUE.id))
      setLivePulse((n) => n + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  function handleReact(activityId: string, emoji: ReactionEmoji) {
    setActivities(
      toggleReaction(activityId, FEED_LEAGUE.currentUserId, emoji, FEED_LEAGUE.id),
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
      addFeedPost({
        leagueId: FEED_LEAGUE.id,
        actorId: me.id,
        actorName: me.name,
        detail: draft,
        imageUrl: photoUrl ?? undefined,
      }),
    )
    setDraft('')
    // Keep object URL alive inside the saved post; clear composer refs only
    setPhotoUrl(null)
    setPhotoName('')
  }

  return (
    <div className="lf-page">
      <aside className="lf-sidebar">
        <div className="lf-logo">
          <span aria-hidden>⚡</span> LOCKED IN
        </div>

        <p className="lf-eyebrow lf-eyebrow--dark">Your clubhouse</p>
        <a className="lf-nav-link" href="/overview">
          Your league
        </a>

        <p className="lf-eyebrow lf-eyebrow--dark">{FEED_LEAGUE.name}</p>
        <nav aria-label="League">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={NAV_ROUTES[item]}
              className={`lf-nav-link ${item === 'Live feed' ? 'lf-nav-link--active' : ''}`}
              aria-current={item === 'Live feed' ? 'page' : undefined}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="lf-sidebar-note">
          <p className="lf-eyebrow lf-eyebrow--lime">Hype each other up</p>
          <p>React to wins. Drop proof. Keep the league loud.</p>
        </div>
      </aside>

      <div className="lf-main">
        <header className="lf-topbar">
          <span>
            Your leagues / {FEED_LEAGUE.name} / Live feed
          </span>
          <span>{dateLabel}</span>
        </header>

        <main className="lf-content">
          <div className="lf-heading-row">
            <div>
              <p className="lf-eyebrow">{FEED_LEAGUE.name} / Activity</p>
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
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                currentUserId={FEED_LEAGUE.currentUserId}
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
