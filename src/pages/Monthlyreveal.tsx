import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import './Monthlyreveal.css'
import { getCachedLeague, getLeaderboard, getLeagueLogs, getMonthlyResult } from '../services/leagueService'
import type { League, LeaderboardEntry, ProgressLog } from '../services/leagueService'

// ---------- Real data from the backend ----------

type Member = {
  id: number
  name: string
  points: number
  consistency: number // % of days this month with at least one log
  bestStreak: number // longest run of days in a row this month
  sessions: number // logs this month
  minutes: number // minutes logged this month
  lateNightSessions: number // logs started after 10 PM (or before 4 AM)
  improvement: number | null // points vs. last month, if last month was finalized
}

type RecapData = {
  league: League
  monthName: string
  final: boolean // true once the month has been officially crowned
  ranked: Member[]
  hasLastMonth: boolean
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function longestRun(dates: string[]) {
  const sorted = [...new Set(dates)].sort()
  let best = 0
  let run = 0
  let prev: number | null = null
  for (const iso of sorted) {
    const day = Date.parse(`${iso}T00:00:00Z`) / 864e5
    run = prev !== null && day === prev + 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }
  return best
}

/** Combine the month's standings with stats counted from the league's logs. */
function buildMembers(
  league: League,
  standings: LeaderboardEntry[],
  logs: ProgressLog[],
  month: string,
  daysSoFar: number,
  lastMonth: LeaderboardEntry[] | null,
): Member[] {
  const monthLogs = logs.filter(
    (log) => !log.running && log.localDate.startsWith(month) && (league.goalType === 'TASKS' || log.durationMinutes > 0),
  )
  return standings.map((entry) => {
    const mine = monthLogs.filter((log) => log.userId === entry.userId)
    const activeDays = new Set(mine.map((log) => log.localDate)).size
    const lastPoints = lastMonth?.find((m) => m.userId === entry.userId)?.points
    return {
      id: entry.userId,
      name: entry.displayName,
      points: entry.points,
      consistency: daysSoFar ? Math.round((activeDays / daysSoFar) * 100) : 0,
      bestStreak: longestRun(mine.map((log) => log.localDate)),
      sessions: mine.length,
      minutes: mine.reduce((sum, log) => sum + log.durationMinutes, 0),
      lateNightSessions: mine.filter((log) => {
        const hour = new Date(log.startedAt).getHours()
        return hour >= 22 || hour < 4
      }).length,
      improvement: lastMonth ? entry.points - (lastPoints ?? 0) : null,
    }
  })
}

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
  color: ['#f4d35e', '#ffffff', '#e8bf3a', '#faf6ec'][i % 4],
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

function buildSlides({ league, monthName, final, ranked, hasLastMonth }: RecapData): Slide[] {
  const mvp = ranked[0]
  const second = ranked[1]
  const third = ranked[2]
  const chud = ranked[ranked.length - 1]
  const fakeOut = ranked.length >= 4 ? ranked[ranked.length - 2] : null // second-to-last, for the "just kidding"

  const totalSessions = ranked.reduce((sum, m) => sum + m.sessions, 0)
  const totalPoints = ranked.reduce((sum, m) => sum + m.points, 0)
  const longestStreak = Math.max(0, ...ranked.map((m) => m.bestStreak))

  const byDesc = (key: (m: Member) => number) => [...ranked].sort((a, b) => key(b) - key(a))[0]
  const mostImproved = hasLastMonth ? byDesc((m) => m.improvement ?? 0) : null
  const isTasksGoal = league.goalType === 'TASKS'
  const volumeLeader = byDesc((m) => (isTasksGoal ? m.sessions : m.minutes))
  const nightOwl = byDesc((m) => m.lateNightSessions)
  const mostSessions = [...ranked].filter((m) => m.id !== mvp.id).sort((a, b) => b.sessions - a.sessions)[0] ?? mvp
  const soFar = final ? '' : ' so far'

  const slides: Slide[] = [
    {
      theme: 'dark',
      label: final ? 'Season finale' : 'Monthly recap so far',
      content: (
        <div className="mr-center">
          <p className="mr-kicker mr-anim">{league.name}</p>
          <h1 className="mr-huge mr-anim mr-d1">
            {monthName}.<br />
            {final ? 'Season finale.' : 'The story so far.'}
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
          <p className="mr-kicker mr-anim">The league in numbers{soFar}</p>
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
            {mostImproved ? (
              <div className="mr-award mr-anim mr-d2">
                <span className="mr-award-title">Most improved</span>
                <span className="mr-award-name">{first(mostImproved.name)}</span>
                <span className="mr-award-detail">
                  {(mostImproved.improvement ?? 0) >= 0 ? '+' : ''}
                  {mostImproved.improvement ?? 0} points vs. last month
                </span>
              </div>
            ) : (
              <div className="mr-award mr-anim mr-d2">
                <span className="mr-award-title">
                  {isTasksGoal ? 'Most tasks' : 'Most minutes'}
                </span>
                <span className="mr-award-name">{first(volumeLeader.name)}</span>
                <span className="mr-award-detail">
                  {isTasksGoal
                    ? `${volumeLeader.sessions} tasks logged`
                    : `${volumeLeader.minutes} minutes logged`}
                </span>
              </div>
            )}
            <div className="mr-award mr-anim mr-d3">
              <span className="mr-award-title">Night owl</span>
              <span className="mr-award-name">{nightOwl.lateNightSessions ? first(nightOwl.name) : 'Nobody'}</span>
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
  ]

  if (third) slides.push({ theme: 'dark', label: 'Third place', content: <Podium place={3} member={third} /> })
  if (second) slides.push({ theme: 'dark', label: 'Second place', content: <Podium place={2} member={second} /> })

  slides.push(
    {
      theme: 'dark',
      label: 'The MVP, by the numbers',
      content: (
        <div className="mr-stack">
          <p className="mr-kicker mr-anim">Your {monthName} MVP{soFar}…</p>
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
          <p className="mr-kicker mr-anim">
            {monthName} MVP{soFar}
          </p>
          <p className="mr-trophy mr-slam" aria-hidden>
            🏆
          </p>
          <h2 className="mr-name mr-slam mr-d1">{mvp.name}</h2>
          <p className="mr-sub mr-anim mr-d3">{mvp.sessions} sessions. Zero excuses. The crown is yours.</p>
          <p className="mr-prize mr-anim mr-d4">
            <span>Your reward</span>
            {league.reward}
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
          <p className="mr-sub mr-anim mr-d4">The Chud of the Month{soFar} is…</p>
        </div>
      ),
    },
  )

  if (fakeOut) {
    slides.push({
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
    })
  }

  slides.push(
    {
      theme: 'chud',
      label: `Chud of the Month: ${chud.name}`,
      content: (
        <div className="mr-center">
          <p className="mr-kicker mr-anim">Chud of the Month{soFar}</p>
          <p className="mr-avatar mr-avatar--big mr-wobble" aria-hidden>
            {initials(chud.name)}
          </p>
          <h2 className="mr-name mr-slam mr-d1">{chud.name}</h2>
          <p className="mr-sub mr-anim mr-d3">
            Respect for showing up {chud.sessions} {chud.sessions === 1 ? 'time' : 'times'} anyway.
            {mostImproved && chud.id === mostImproved.id && ' And most improved — next month is yours.'}
          </p>
          <p className="mr-prize mr-prize--chud mr-anim mr-d4">
            <span>Your consequence</span>
            {league.punishment}
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
            <span className="mr-stake-text">{league.reward}</span>
          </div>
          <div className="mr-stake mr-stake--chud mr-anim mr-d3">
            <span className="mr-stake-label">🫠 {first(chud.name)} has to</span>
            <span className="mr-stake-text">{league.punishment}</span>
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
              ⚡ {league.name} · {monthName}
            </p>
            <div className="mr-share-row">
              <span className="mr-share-tag">MVP</span>
              <span className="mr-share-name">{mvp.name}</span>
              <span className="mr-share-pts">{mvp.points}</span>
            </div>
            {second && (
              <div className="mr-share-row">
                <span className="mr-share-tag">2nd</span>
                <span className="mr-share-name">{second.name}</span>
                <span className="mr-share-pts">{second.points}</span>
              </div>
            )}
            {third && (
              <div className="mr-share-row">
                <span className="mr-share-tag">3rd</span>
                <span className="mr-share-name">{third.name}</span>
                <span className="mr-share-pts">{third.points}</span>
              </div>
            )}
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
  )
  return slides
}

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

/** A single full-screen message (loading, no league, not enough data). */
function MessageScreen({ title, detail }: { title: string; detail: ReactNode }) {
  return (
    <div className="mr-page mr-theme-dark">
      <a href="/league" style={{ position: 'fixed', top: 22, left: 24, zIndex: 20, color: 'inherit', font: '700 12px system-ui', textDecoration: 'none' }}>← Dashboard</a>
      <section className="mr-slide">
        <div className="mr-center">
          <h1 className="mr-big">{title}</h1>
          <p className="mr-sub">{detail}</p>
        </div>
      </section>
    </div>
  )
}

// ---------- Page ----------

export default function MonthlyReveal() {
  const league = useMemo(() => getCachedLeague(), [])
  const [data, setData] = useState<RecapData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!league) return
    const now = new Date()
    const month = monthKey(now)
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    Promise.all([
      getMonthlyResult(league.id, month),
      getLeaderboard(league.id, 'monthly'),
      getLeagueLogs(league.id),
      getMonthlyResult(league.id, lastMonth),
    ])
      .then(([finalResult, live, logs, previous]) => {
        // Use the official results once the month is crowned; otherwise the live standings so far.
        const standings = finalResult?.standings.length ? finalResult.standings : live
        setData({
          league,
          monthName: now.toLocaleDateString('en-US', { month: 'long' }),
          final: !!finalResult,
          ranked: buildMembers(league, standings, logs, month, now.getDate(), previous?.standings ?? null),
          hasLastMonth: !!previous,
        })
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [league])

  if (!league) {
    return <MessageScreen title="Pick a league first." detail={<a href="/overview" style={{ color: 'inherit' }}>Go to Your leagues →</a>} />
  }
  if (status === 'loading') return <MessageScreen title="Tallying the month…" detail="Counting every session." />
  if (status === 'error' || !data) {
    return <MessageScreen title="Couldn't load the recap." detail="Make sure the backend is running, then refresh." />
  }
  if (data.ranked.length < 2) {
    return <MessageScreen title="Not enough players yet." detail="The recap needs at least 2 members. Invite your crew!" />
  }
  if (data.ranked.every((m) => m.sessions === 0 && m.points === 0)) {
    return <MessageScreen title={`No sessions in ${data.monthName} yet.`} detail="Log your first one and the recap will start filling in." />
  }
  return <RecapSlides slides={buildSlides(data)} />
}

function RecapSlides({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const isLast = index === slides.length - 1
  const slide = slides[index]

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), [slides.length])
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
      <a href="/league" style={{ position: 'fixed', top: 22, left: 24, zIndex: 20, color: 'inherit', font: '700 12px system-ui', textDecoration: 'none' }}>← Dashboard</a>
      {/* Progress bars */}
      <div className="mr-progress" aria-hidden>
        {slides.map((_, i) => (
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
          {index + 1} / {slides.length}
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
