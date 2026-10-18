import { useState } from 'react'
import type { FormEvent } from 'react'
import './Dashboard.css'

// ---------- Mock data (replace with real data from the backend later) ----------

type LeagueSummary = {
  id: string
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
  members: string[] // member names, for the avatar stack
  color: string // card cover color
}

const USER = { name: 'Alex Chen', school: 'University of Washington' }

const LEAGUES: LeagueSummary[] = [
  {
    id: '8am-club',
    name: 'The 8 AM Club',
    goal: 'Focused study sessions',
    weeklyTarget: 4,
    myWeekDone: 3,
    myRank: 2,
    memberCount: 6,
    myPoints: 780,
    myStreak: 8,
    leaderName: 'Maya Patel',
    leaderPoints: 860,
    checkedInToday: true,
    members: ['Maya Patel', 'Alex Chen', 'Jay Park', 'Nia Brooks', 'Leo Martinez', 'Sam Wilson'],
    color: '#13261b',
  },
  {
    id: 'gym-rats',
    name: 'Gym Rats',
    goal: 'Gym sessions',
    weeklyTarget: 3,
    myWeekDone: 1,
    myRank: 4,
    memberCount: 5,
    myPoints: 410,
    myStreak: 0,
    leaderName: 'Jordan Lee',
    leaderPoints: 620,
    checkedInToday: false,
    members: ['Jordan Lee', 'Alex Chen', 'Priya Shah', 'Marcus Hill', 'Tess Ng'],
    color: '#2c4a37',
  },
  {
    id: 'page-turners',
    name: 'Page Turners',
    goal: 'Read for 30 minutes',
    weeklyTarget: 5,
    myWeekDone: 5,
    myRank: 1,
    memberCount: 4,
    myPoints: 540,
    myStreak: 15,
    leaderName: 'Alex Chen',
    leaderPoints: 540,
    checkedInToday: false,
    members: ['Alex Chen', 'Rosa Diaz', 'Ben Cho', 'Ivy Moore'],
    color: '#3f3a24',
  },
]

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

type DashboardProps = {
  // Hook these up to navigation later. Until then they log to the console.
  onOpenLeague?: (leagueId: string) => void
  onCreateLeague?: () => void
  onJoinLeague?: (code: string) => void
}

export default function Dashboard({
  onOpenLeague = (id) => console.log('Open league', id),
  onCreateLeague = () => console.log('Create league'),
  onJoinLeague = (code) => console.log('Join league with code', code),
}: DashboardProps) {
  const [today] = useState(() => new Date()) // read the date once when the page loads
  const [joinCode, setJoinCode] = useState('')
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length)) // random quote on load
  const quote = QUOTES[quoteIndex]

  const daysLeft = daysLeftInMonth(today)
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  function nextQuote() {
    setQuoteIndex((i) => (i + 1) % QUOTES.length)
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    onJoinLeague(code)
    setJoinCode('')
  }

  return (
    <div className="db-page">
      {/* ---------- Sidebar ---------- */}
      <aside className="db-sidebar">
        <div className="db-logo">
          <span aria-hidden>⚡</span> LOCKED IN
        </div>

        <p className="db-eyebrow db-eyebrow--dark">Your clubhouse</p>
        <a className="db-nav-link db-nav-link--active" href="#" aria-current="page">
          Your leagues
        </a>

        <p className="db-eyebrow db-eyebrow--dark">Leagues</p>
        <nav aria-label="Your leagues">
          {LEAGUES.map((league) => (
            <button key={league.id} className="db-nav-link db-nav-league" onClick={() => onOpenLeague(league.id)}>
              <span className="db-nav-dot" style={{ background: league.checkedInToday ? '#c8f04f' : '#6b7d68' }} aria-hidden />
              {league.name}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-user">
          <span className="db-avatar db-avatar--me" aria-hidden>
            {initials(USER.name)}
          </span>
          <div>
            <p className="db-user-name">{USER.name}</p>
            <p className="db-user-school">{USER.school}</p>
          </div>
        </div>
      </aside>

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
                {greeting(today.getHours())}, {first(USER.name)}.
              </h1>
              <p className="db-subtitle">
                {LEAGUES.length === 0
                  ? 'Start a league or join one to get going.'
                  : `${LEAGUES.length} ${LEAGUES.length === 1 ? 'league' : 'leagues'}, ${daysLeft} days left in the ${monthName} season.`}
              </p>
            </div>
            <button className="db-btn db-btn--primary" onClick={onCreateLeague}>
              + New league
            </button>
          </div>

          {LEAGUES.length === 0 ? (
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
                <button className="db-btn db-btn--primary" onClick={onCreateLeague}>
                  Create a league
                </button>
                <JoinForm code={joinCode} setCode={setJoinCode} onSubmit={handleJoin} />
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
                  <JoinForm code={joinCode} setCode={setJoinCode} onSubmit={handleJoin} />
                </div>

                <ul className="db-grid">
                  {LEAGUES.map((league) => (
                    <li key={league.id}>
                      <LeagueCard league={league} onOpen={() => onOpenLeague(league.id)} />
                    </li>
                  ))}
                  <li>
                    <button className="db-card db-card--new" onClick={onCreateLeague}>
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

function LeagueCard({ league, onOpen }: { league: LeagueSummary; onOpen: () => void }) {
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
            {shown.map((name) => (
              <span key={name} className={`db-avatar ${name === USER.name ? 'db-avatar--me' : ''}`}>
                {initials(name)}
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
}: {
  code: string
  setCode: (value: string) => void
  onSubmit: (e: FormEvent) => void
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
      <button type="submit" className="db-btn db-btn--ghost">
        Join
      </button>
    </form>
  )
}