import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './Dashboard.css'
import { cachedUser, getMyProfile } from '../services/authService'
import {
  getLeagueLogs,
  getLeagueMembers,
  getLeagueOverview,
  getMyLeagues,
  joinLeague,
  setActiveLeague,
  clearActiveLeague,
} from '../services/leagueService'
import type { League } from '../services/leagueService'
import type { UserProfile } from '../types/api'
import AppSidebar from '../components/AppSidebar'
import { resolveImageUrl } from '../services/imageService'

// ---------- Mock data (replace with real data from the backend later) ----------

type LeagueSummary = {
  id: number
  name: string
  goal: string // e.g. "Focused study sessions"
  weeklyTarget: number // e.g. 4
  myWeekDone: number // how many the current user has done this week
  myRank: number
  memberCount: number
  myPoints: number
  myStreak: number // days in a row
  leaderName: string
  leaderPoints: number
  checkedInToday: boolean
  members: Array<{ id: number; name: string; avatarUrl: string | null }>
  color: string // card cover color
  league: League
}

const CARD_COLORS = ['#328EAB', '#FF9778', '#244452', '#E68061', '#28758E', '#D19C29']

// ---------- Helpers ----------

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function first(name: string) {
  return name.split(' ')[0]
}

// Funny motivational quotes for the top of the dashboard.
const QUOTES = [
  { text: "The leaderboard doesn't care how you feel. Log the session anyway.", by: 'The leaderboard' },
  { text: 'Nobody remembers second place. Except the group chat. The group chat remembers everything.', by: 'Your group chat' },
  { text: "You can't spell Chud without U. Let's fix that.", by: "Last month's Chud" },
  { text: 'Discipline is doing the thing while your bed whispers your name.', by: 'Your 8 AM alarm' },
  { text: 'Your streak is a houseplant. Water it daily or watch it die.', by: 'Someone with a dead streak' },
  { text: 'Every session you skip is a free point for your friends.', by: 'League math' },
  { text: 'Rest days are earned. Couch days are taxed.', by: 'The scoring system' },
  { text: "Be the reason someone else's ranking drops today.", by: 'Healthy competition' },
  { text: 'Motivation fades. Being crowned Chud of the Month is forever.', by: 'The share card' },
  { text: 'You are one session away from a better mood and a worse day for your rivals.', by: 'Science, probably' },
]

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function daysLeftInMonth(today: Date) {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return lastDay - today.getDate()
}

// ---------- Page ----------

export default function Dashboard() {
  const [today] = useState(() => new Date()) // read the date once when the page loads
  const [joinCode, setJoinCode] = useState('')
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length)) // random quote on load
  const [user, setUser] = useState<UserProfile | null>(() => cachedUser())
  const [leagues, setLeagues] = useState<LeagueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const quote = QUOTES[quoteIndex]
  const userName = user?.displayName || user?.name || 'Player'

  const daysLeft = daysLeftInMonth(today)
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    let cancelled = false
    clearActiveLeague()

    async function loadDashboard() {
      setLoading(true)
      setError('')
      try {
        const [profile, memberships] = await Promise.all([getMyProfile(), getMyLeagues()])
        const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: profile.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(today)
        const summaries = await Promise.all(memberships.map(async (league, index): Promise<LeagueSummary> => {
          const [overview, members, logs] = await Promise.all([
            getLeagueOverview(league.id),
            getLeagueMembers(league.id),
            getLeagueLogs(league.id, profile.id),
          ])
          const mine = overview.weeklyLeaderboard.find((entry) => entry.userId === profile.id)
          const leader = overview.weeklyLeaderboard[0]
          return {
            id: league.id,
            name: league.name,
            goal: league.goalDescription,
            weeklyTarget: league.weeklyTarget,
            myWeekDone: overview.myWeeklyProgress,
            myRank: mine?.rank ?? overview.memberCount,
            memberCount: overview.memberCount,
            myPoints: mine?.points ?? 0,
            myStreak: mine?.streak ?? profile.currentStreak,
            leaderName: leader?.displayName ?? profile.displayName ?? profile.name,
            leaderPoints: leader?.points ?? 0,
            checkedInToday: logs.some((log) => log.localDate === todayKey && !log.running),
            members: members.map((member) => ({ id: member.userId, name: member.displayName, avatarUrl: member.avatarUrl })),
            color: CARD_COLORS[index % CARD_COLORS.length]!,
            league,
          }
        }))
        if (!cancelled) {
          setUser(profile)
          setLeagues(summaries)
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not load your leagues.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDashboard()
    return () => { cancelled = true }
  }, [today])

  function nextQuote() {
    setQuoteIndex((i) => (i + 1) % QUOTES.length)
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)
    setError('')
    try {
      await joinLeague(code)
      window.location.reload()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not join that league.')
      setJoining(false)
    }
  }

  function openLeague(summary: LeagueSummary) {
    setActiveLeague(summary.league)
    window.location.assign('/league')
  }

  return (
    <div className="db-page">
      <AppSidebar active="leagues" clubhouseOnly />

      {/* ---------- Main ---------- */}
      <div className="db-main">
        <header className="db-topbar">
          <span>Clubhouse / Your leagues</span>
          <span>{dateLabel}</span>
        </header>

        <main className="db-content">
          <div className="db-heading-row">
            <div>
              <p className="db-eyebrow">{dateLabel}</p>
              <h1 className="db-title">
                {greeting(today.getHours())}, {first(userName)}.
              </h1>
              <p className="db-subtitle">
                {leagues.length === 0
                  ? 'Start a league or join one to get going.'
                  : `${leagues.length} ${leagues.length === 1 ? 'league' : 'leagues'}, ${daysLeft} days left in the ${monthName} season.`}
              </p>
            </div>
            <button className="db-btn db-btn--primary" onClick={() => window.location.assign('/create-league')}>
              + New league
            </button>
          </div>

          {error && <div className="db-error" role="alert">{error}</div>}

          {loading ? (
            <section className="db-empty"><p className="db-hint">Loading your leagues…</p></section>
          ) : leagues.length === 0 ? (
            /* ---------- Empty state ---------- */
            <section className="db-empty">
              <p className="db-empty-icon" aria-hidden>
                🏆
              </p>
              <h2 className="db-card-title">No leagues yet</h2>
              <p className="db-hint">
                Pick a goal, invite 3 to 14 friends, and start competing. Or join a friend's league with their code.
              </p>
              <div className="db-empty-actions">
                <button className="db-btn db-btn--primary" onClick={() => window.location.assign('/create-league')}>
                  Create a league
                </button>
                <JoinForm code={joinCode} setCode={setJoinCode} onSubmit={handleJoin} disabled={joining} />
              </div>
            </section>
          ) : (
            <>
              {/* ---------- Motivational quote ---------- */}
              <section className="db-quote" aria-label="Today's motivation">
                <p className="db-quote-mark" aria-hidden>
                  “
                </p>
                <figure className="db-quote-body">
                  <blockquote aria-live="polite">{quote.text}</blockquote>
                  <figcaption>— {quote.by}</figcaption>
                </figure>
                <button className="db-quote-btn" onClick={nextQuote}>
                  ↻ Another one
                </button>
              </section>

              {/* ---------- League cards ---------- */}
              <section aria-labelledby="leagues-heading">
                <div className="db-section-header">
                  <h2 id="leagues-heading" className="db-card-title">
                    Your leagues
                  </h2>
                  <JoinForm code={joinCode} setCode={setJoinCode} onSubmit={handleJoin} disabled={joining} />
                </div>

                <ul className="db-grid">
                  {leagues.map((league) => (
                    <li key={league.id}>
                      <LeagueCard league={league} currentUserId={user?.id} onOpen={() => openLeague(league)} />
                    </li>
                  ))}
                  <li>
                    <button className="db-card db-card--new" onClick={() => window.location.assign('/create-league')}>
                      <span className="db-new-plus" aria-hidden>
                        +
                      </span>
                      <span className="db-new-title">Start a new league</span>
                      <span className="db-hint">New goal, new crew.</span>
                    </button>
                  </li>
                </ul>
              </section>
            </>
          )}
        </main>

        <footer className="db-footer">
          <span>Locked In • Show up for your people</span>
          <span>Private leagues. Shared wins.</span>
        </footer>
      </div>
    </div>
  )
}

// ---------- League card ----------

function LeagueCard({ league, currentUserId, onOpen }: { league: LeagueSummary; currentUserId?: number; onOpen: () => void }) {
  const progress = Math.min(league.myWeekDone / league.weeklyTarget, 1)
  const goalMet = league.myWeekDone >= league.weeklyTarget
  const isLeader = league.myRank === 1
  const behind = league.leaderPoints - league.myPoints
  const shown = league.members.slice(0, 5)
  const extra = league.members.length - shown.length

  return (
    <button className="db-card" onClick={onOpen} aria-label={`Open ${league.name}`}>
      {/* Cover */}
      <span className="db-cover" style={{ background: league.color }}>
        <span className="db-cover-top">
          <span className="db-rank">
            #{league.myRank}
            <span> of {league.memberCount}</span>
          </span>
          <span className={`db-status ${league.checkedInToday ? 'db-status--done' : ''}`}>
            {league.checkedInToday ? '✓ Checked in' : 'Check in today'}
          </span>
        </span>
        <span className="db-cover-name">{league.name}</span>
        <span className="db-cover-goal">
          {league.goal} · {league.weeklyTarget}x a week
        </span>
      </span>

      {/* Body */}
      <span className="db-card-body">
        <span className="db-progress-row">
          <span>This week</span>
          <span className={goalMet ? 'db-goal-met' : ''}>
            {league.myWeekDone} / {league.weeklyTarget}
            {goalMet && ' · Goal hit'}
          </span>
        </span>
        <span className="db-bar" aria-hidden>
          <span style={{ width: `${progress * 100}%` }} />
        </span>

        <span className="db-card-stats">
          <span>
            <span className="db-card-stat-value">{league.myPoints}</span>
            <span className="db-card-stat-label">points</span>
          </span>
          <span>
            <span className="db-card-stat-value">
              {league.myStreak > 0 ? `${league.myStreak}🔥` : '0'}
            </span>
            <span className="db-card-stat-label">day streak</span>
          </span>
        </span>

        <span className="db-card-footer">
          <span className="db-avatars" aria-hidden>
            {shown.map((member) => (
              <span key={member.id} className={`db-avatar ${member.id === currentUserId ? 'db-avatar--me' : ''}`}>
                {member.avatarUrl ? <img src={resolveImageUrl(member.avatarUrl)} alt="" /> : initials(member.name)}
              </span>
            ))}
            {extra > 0 && <span className="db-avatar">+{extra}</span>}
          </span>
          <span className="db-leader">
            {isLeader ? "You're leading" : `${behind} pts behind ${first(league.leaderName)}`}
          </span>
        </span>
      </span>
    </button>
  )
}

// ---------- Join form ----------

function JoinForm({
  code,
  setCode,
  onSubmit,
  disabled,
}: {
  code: string
  setCode: (value: string) => void
  onSubmit: (e: FormEvent) => void
  disabled: boolean
}) {
  return (
    <form className="db-join" onSubmit={onSubmit}>
      <label className="db-visually-hidden" htmlFor="join-code">
        Invite code
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        maxLength={8}
        autoComplete="off"
      />
      <button type="submit" className="db-btn db-btn--ghost" disabled={disabled || !code.trim()}>
        {disabled ? 'Joining…' : 'Join'}
      </button>
    </form>
  )
}
