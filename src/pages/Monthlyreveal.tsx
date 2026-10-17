import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import './Monthlyreveal.css'

// ---------- Mock data (replace with real data from the backend later) ----------

type Member = {
  id: string
  name: string
  points: number
  consistency: number // % of days checked in
  bestStreak: number // longest streak this month, in days
  sessions: number // sessions logged this month
  lateNightSessions: number // sessions logged after 10 PM
  improvement: number // points gained vs. last month
}

const LEAGUE = {
  name: 'The 8 AM Club',
  month: 'October',
  // Both of these are set by the league creator when the league is created.
  reward: "Winner's dinner is covered",
  punishment: 'Buys boba for the whole league',
}

const MEMBERS: Member[] = [
  { id: 'mp', name: 'Maya Patel', points: 860, consistency: 94, bestStreak: 12, sessions: 42, lateNightSessions: 3, improvement: 120 },
  { id: 'ac', name: 'Alex Chen', points: 780, consistency: 88, bestStreak: 8, sessions: 38, lateNightSessions: 6, improvement: 40 },
  { id: 'jp', name: 'Jay Park', points: 745, consistency: 88, bestStreak: 6, sessions: 36, lateNightSessions: 14, improvement: 15 },
  { id: 'nb', name: 'Nia Brooks', points: 710, consistency: 82, bestStreak: 5, sessions: 35, lateNightSessions: 2, improvement: 60 },
  { id: 'lm', name: 'Leo Martinez', points: 640, consistency: 76, bestStreak: 3, sessions: 33, lateNightSessions: 5, improvement: -20 },
  { id: 'sw', name: 'Sam Wilson', points: 520, consistency: 71, bestStreak: 2, sessions: 30, lateNightSessions: 4, improvement: 210 },
]

// ---------- Derived results ----------

const ranked = [...MEMBERS].sort((a, b) => b.points - a.points)
const mvp = ranked[0]
const second = ranked[1]
const third = ranked[2]
const chud = ranked[ranked.length - 1]
const fakeOut = ranked[ranked.length - 2] // second-to-last, for the "just kidding"

const totalSessions = MEMBERS.reduce((sum, m) => sum + m.sessions, 0)
const totalPoints = MEMBERS.reduce((sum, m) => sum + m.points, 0)
const longestStreak = Math.max(...MEMBERS.map((m) => m.bestStreak))

const mostImproved = [...MEMBERS].sort((a, b) => b.improvement - a.improvement)[0]
const nightOwl = [...MEMBERS].sort((a, b) => b.lateNightSessions - a.lateNightSessions)[0]
const mostSessions = [...MEMBERS].filter((m) => m.id !== mvp.id).sort((a, b) => b.sessions - a.sessions)[0]

function ordinal(n: number) {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${suffix}`
}

function first(name: string) {
  return name.split(' ')[0]
}

// Confetti pieces are generated once so they look the same on every render.
const CONFETTI = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 13) % 20) / 10,
  duration: 2.4 + ((i * 7) % 10) / 10,
  color: ['#c8f04f', '#ffffff', '#8fd14f', '#f4f1e9'][i % 4],
  rotate: (i * 47) % 360,
}))

// ---------- Count-up number ----------

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function CountUp({ to, duration = 1400, delay = 0 }: { to: number; duration?: number; delay?: number }) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? to : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    let start: number | null = null
    const timer = setTimeout(() => {
      const tick = (now: number) => {
        if (start === null) start = now
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // fast start, slow finish
        setValue(Math.round(to * eased))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [to, duration, delay])

  return <>{value.toLocaleString()}</>
}

// ---------- Slides ----------

type Slide = {
  theme: 'dark' | 'lime' | 'cream' | 'chud'
  label: string // for screen readers
  content: ReactNode
}

const SLIDES: Slide[] = [
  {
    theme: 'dark',
    label: 'Season finale',
    content: (
      <div className="mr-center">
        <p className="mr-kicker mr-anim">{LEAGUE.name}</p>
        <h1 className="mr-huge mr-anim mr-d1">
          {LEAGUE.month}.<br />
          Season finale.
        </h1>
        <p className="mr-tap">Tap to begin</p>
      </div>
    ),
  },
  {
    theme: 'dark',
    label: 'The league in numbers',
    content: (
      <div className="mr-stack">
        <p className="mr-kicker mr-anim">The league in numbers</p>
        <div className="mr-stat mr-anim mr-d1">
          <span className="mr-stat-num">
            <CountUp to={totalSessions} delay={300} />
          </span>
          <span className="mr-stat-label">sessions logged together</span>
        </div>
        <div className="mr-stat mr-anim mr-d2">
          <span className="mr-stat-num">
            <CountUp to={totalPoints} delay={900} />
          </span>
          <span className="mr-stat-label">points on the board</span>
        </div>
        <div className="mr-stat mr-anim mr-d3">
          <span className="mr-stat-num">
            <CountUp to={longestStreak} delay={1500} duration={800} />
          </span>
          <span className="mr-stat-label">days — the longest streak</span>
        </div>
      </div>
    ),
  },
  {
    theme: 'cream',
    label: 'Superlatives',
    content: (
      <div className="mr-stack">
        <p className="mr-kicker mr-anim">Before the big ones</p>
        <h2 className="mr-big mr-anim mr-d1">Some honorable mentions.</h2>
        <div className="mr-awards">
          <div className="mr-award mr-anim mr-d2">
            <span className="mr-award-title">Most improved</span>
            <span className="mr-award-name">{first(mostImproved.name)}</span>
            <span className="mr-award-detail">+{mostImproved.improvement} points vs. last month</span>
          </div>
          <div className="mr-award mr-anim mr-d3">
            <span className="mr-award-title">Night owl</span>
            <span className="mr-award-name">{first(nightOwl.name)}</span>
            <span className="mr-award-detail">{nightOwl.lateNightSessions} sessions after 10 PM</span>
          </div>
          <div className="mr-award mr-anim mr-d4">
            <span className="mr-award-title">Grinder</span>
            <span className="mr-award-name">{first(mostSessions.name)}</span>
            <span className="mr-award-detail">{mostSessions.sessions} sessions logged</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    theme: 'dark',
    label: 'Third place',
    content: <Podium place={3} member={third} />,
  },
  {
    theme: 'dark',
    label: 'Second place',
    content: <Podium place={2} member={second} />,
  },
  {
    theme: 'dark',
    label: 'The MVP, by the numbers',
    content: (
      <div className="mr-stack">
        <p className="mr-kicker mr-anim">Your {LEAGUE.month} MVP…</p>
        <div className="mr-stat mr-anim mr-d1">
          <span className="mr-stat-num">
            <CountUp to={mvp.points} delay={400} />
          </span>
          <span className="mr-stat-label">points</span>
        </div>
        <div className="mr-stat mr-anim mr-d3">
          <span className="mr-stat-num">
            <CountUp to={mvp.consistency} delay={1400} duration={900} />%
          </span>
          <span className="mr-stat-label">consistency</span>
        </div>
        <div className="mr-stat mr-anim mr-d5">
          <span className="mr-stat-num">
            <CountUp to={mvp.bestStreak} delay={2400} duration={700} />
          </span>
          <span className="mr-stat-label">day streak</span>
        </div>
        <p className="mr-guess mr-anim mr-d7">Any guesses?</p>
      </div>
    ),
  },
  {
    theme: 'lime',
    label: `MVP: ${mvp.name}`,
    content: (
      <div className="mr-center">
        <Confetti />
        <p className="mr-kicker mr-anim">{LEAGUE.month} MVP</p>
        <p className="mr-trophy mr-slam" aria-hidden>
          🏆
        </p>
        <h2 className="mr-name mr-slam mr-d1">{mvp.name}</h2>
        <p className="mr-sub mr-anim mr-d3">
          {mvp.sessions} sessions. Zero excuses. The crown is yours.
        </p>
        <p className="mr-prize mr-anim mr-d4">
          <span>Your reward</span>
          {LEAGUE.reward}
        </p>
      </div>
    ),
  },
  {
    theme: 'chud',
    label: 'And now, last place',
    content: (
      <div className="mr-center">
        <p className="mr-kicker mr-anim">Okay. Deep breath.</p>
        <h2 className="mr-big mr-anim mr-d2">
          And now… the moment
          <br />
          you've all been waiting for.
        </h2>
        <p className="mr-sub mr-anim mr-d4">The Chud of the Month is…</p>
      </div>
    ),
  },
  {
    theme: 'chud',
    label: `Fake out: it is not ${fakeOut.name}`,
    content: (
      <div className="mr-center">
        <div className="mr-fake">
          <p className="mr-avatar mr-anim">{initials(fakeOut.name)}</p>
          <h2 className="mr-name mr-anim mr-d1">{first(fakeOut.name)}?</h2>
        </div>
        <p className="mr-kidding mr-stamp">Just kidding.</p>
        <p className="mr-sub mr-anim mr-d6">
          {first(fakeOut.name)} finished {ordinal(ranked.length - 1)}. You're safe, {first(fakeOut.name)}.
        </p>
      </div>
    ),
  },
  {
    theme: 'chud',
    label: `Chud of the Month: ${chud.name}`,
    content: (
      <div className="mr-center">
        <p className="mr-kicker mr-anim">Chud of the Month</p>
        <p className="mr-avatar mr-avatar--big mr-wobble" aria-hidden>
          {initials(chud.name)}
        </p>
        <h2 className="mr-name mr-slam mr-d1">{chud.name}</h2>
        <p className="mr-sub mr-anim mr-d3">
          Respect for showing up {chud.sessions} times anyway.
          {chud.id === mostImproved.id && ' And most improved — next month is yours.'}
        </p>
        <p className="mr-prize mr-prize--chud mr-anim mr-d4">
          <span>Your punishment</span>
          {LEAGUE.punishment}
        </p>
      </div>
    ),
  },
  {
    theme: 'dark',
    label: 'The stakes',
    content: (
      <div className="mr-stack">
        <p className="mr-kicker mr-anim">Time to settle up</p>
        <div className="mr-stake mr-anim mr-d1">
          <span className="mr-stake-label">🥇 {first(mvp.name)} gets</span>
          <span className="mr-stake-text">{LEAGUE.reward}</span>
        </div>
        <div className="mr-stake mr-stake--chud mr-anim mr-d3">
          <span className="mr-stake-label">🫠 {first(chud.name)} has to</span>
          <span className="mr-stake-text">{LEAGUE.punishment}</span>
        </div>
      </div>
    ),
  },
  {
    theme: 'cream',
    label: 'Share card',
    content: (
      <div className="mr-center">
        <div className="mr-share mr-anim">
          <p className="mr-share-league">
            ⚡ {LEAGUE.name} · {LEAGUE.month}
          </p>
          <div className="mr-share-row">
            <span className="mr-share-tag">MVP</span>
            <span className="mr-share-name">{mvp.name}</span>
            <span className="mr-share-pts">{mvp.points}</span>
          </div>
          <div className="mr-share-row">
            <span className="mr-share-tag">2nd</span>
            <span className="mr-share-name">{second.name}</span>
            <span className="mr-share-pts">{second.points}</span>
          </div>
          <div className="mr-share-row">
            <span className="mr-share-tag">3rd</span>
            <span className="mr-share-name">{third.name}</span>
            <span className="mr-share-pts">{third.points}</span>
          </div>
          <div className="mr-share-row mr-share-row--chud">
            <span className="mr-share-tag">Chud</span>
            <span className="mr-share-name">{chud.name}</span>
            <span className="mr-share-pts">{chud.points}</span>
          </div>
          <p className="mr-share-footer">{totalSessions} sessions logged together · Locked In</p>
        </div>
        <p className="mr-sub mr-anim mr-d2">Screenshot it. Send it to the group chat.</p>
      </div>
    ),
  },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Podium({ place, member }: { place: 2 | 3; member: Member }) {
  return (
    <div className="mr-center">
      <p className="mr-kicker mr-anim">The podium</p>
      <p className="mr-place mr-slam">{place === 3 ? '3rd' : '2nd'}</p>
      <h2 className="mr-name mr-anim mr-d2">{member.name}</h2>
      <p className="mr-sub mr-anim mr-d3">
        {member.points} points · {member.consistency}% consistency · {member.bestStreak}-day best streak
      </p>
    </div>
  )
}

function Confetti() {
  return (
    <div className="mr-confetti" aria-hidden>
      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animationDelay: `${0.4 + piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ---------- Page ----------

export default function MonthlyReveal() {
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1
  const slide = SLIDES[index]

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, SLIDES.length - 1)), [])
  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])

  // Keyboard: right arrow / space = next, left arrow = back.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        back()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back])

  return (
    <div className={`mr-page mr-theme-${slide.theme}`}>
      <a href="/overview" style={{ position: 'fixed', top: 22, left: 24, zIndex: 20, color: 'inherit', font: '700 12px system-ui', textDecoration: 'none' }}>← Overview</a>
      {/* Progress bars */}
      <div className="mr-progress" aria-hidden>
        {SLIDES.map((_, i) => (
          <span key={i} className={i < index ? 'mr-done' : i === index ? 'mr-current' : ''} />
        ))}
      </div>

      {/* Tap left third = back, anywhere else = next */}
      <button className="mr-tap-zone mr-tap-zone--back" onClick={back} aria-hidden tabIndex={-1} />
      <button className="mr-tap-zone mr-tap-zone--next" onClick={next} aria-hidden tabIndex={-1} />

      {/* key={index} remounts the slide so its animations replay */}
      <section key={index} className="mr-slide" aria-live="polite" aria-label={slide.label}>
        {slide.content}
      </section>

      {/* Visible controls for keyboard and screen reader users */}
      <div className="mr-controls">
        <button onClick={back} disabled={index === 0}>
          ← Back
        </button>
        <span>
          {index + 1} / {SLIDES.length}
        </span>
        {isLast ? (
          <button onClick={() => setIndex(0)}>Watch again ↺</button>
        ) : (
          <button onClick={next}>Next →</button>
        )}
      </div>
    </div>
  )
}
