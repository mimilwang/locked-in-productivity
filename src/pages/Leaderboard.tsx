import { useState } from 'react'
import './Leaderboard.css'
import AppSidebar from '../components/AppSidebar'

// ---------- Mock data (replace with real data from the backend later) ----------

type Member = {
  id: string
  name: string
  goalDone: number // sessions completed this week
  streak: number // days in a row
  consistency: number // % of days checked in this season
  points: number // total points this month
  todayPoints: number // points earned today
}

const LEAGUE = {
  name: 'The 8 AM Club',
  weeklyGoal: 4,
  currentUserId: 'ac', // the person viewing the page
}

const MEMBERS: Member[] = [
  { id: 'mp', name: 'Maya Patel', goalDone: 4, streak: 12, consistency: 94, points: 860, todayPoints: 115 },
  { id: 'ac', name: 'Alex Chen', goalDone: 3, streak: 8, consistency: 88, points: 780, todayPoints: 65 },
  { id: 'jp', name: 'Jay Park', goalDone: 3, streak: 6, consistency: 88, points: 745, todayPoints: 65 },
  { id: 'nb', name: 'Nia Brooks', goalDone: 3, streak: 5, consistency: 82, points: 710, todayPoints: 65 },
  { id: 'lm', name: 'Leo Martinez', goalDone: 2, streak: 3, consistency: 76, points: 640, todayPoints: 65 },
  { id: 'sw', name: 'Sam Wilson', goalDone: 2, streak: 2, consistency: 71, points: 520, todayPoints: 40 },
]

// ---------- Helpers ----------

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function firstName(name: string) {
  return name.split(' ')[0]
}

function daysLeftInMonth(today: Date) {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return lastDay - today.getDate()
}

function pad(rank: number) {
  return String(rank).padStart(2, '0')
}

// ---------- Page ----------

export default function Leaderboard() {
  const [month, setMonth] = useState('October 2026')

  const [today] = useState(() => new Date()) // read the date once when the page loads
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const daysLeft = daysLeftInMonth(today)

  // Rank everyone by total points, and separately by today's points.
  const standings = [...MEMBERS].sort((a, b) => b.points - a.points)
  const todaysRace = [...MEMBERS].sort((a, b) => b.todayPoints - a.todayPoints)

  const leader = standings[0]
  const myRank = standings.findIndex((m) => m.id === LEAGUE.currentUserId) + 1
  const me = standings[myRank - 1]
  const pointsBehind = leader.points - me.points

  return (
    <div className="lb-page">
      {/* ---------- Sidebar ---------- */}
      <AppSidebar active="leaderboard" />

      {/* ---------- Main ---------- */}
      <div className="lb-main">
        <header className="lb-topbar">
          <span>Your leagues / {LEAGUE.name} / Leaderboard</span>
        </header>

        <main className="lb-content">
          <div className="lb-heading-row">
            <div>
              <p className="lb-eyebrow">
                {LEAGUE.name} / The {monthName} race
              </p>
              <h1 className="lb-title">The standings don't lie.</h1>
              <p className="lb-subtitle">Every session matters. So does coming back tomorrow.</p>
            </div>
            <label className="lb-month">
              <span className="lb-visually-hidden">Month</span>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option>October 2026</option>
              </select>
            </label>
          </div>

          {/* ----- Top stats ----- */}
          <section className="lb-stats" aria-label="Race summary">
            <div className="lb-leader-card">
              <div className="lb-trophy" aria-hidden>
                🏆
                <span>NO. 1</span>
              </div>
              <div>
                <p className="lb-eyebrow lb-eyebrow--lime">MVP race / Current leader</p>
                <p className="lb-leader-name">{leader.name}</p>
                <p className="lb-leader-detail">
                  {leader.points} points · {leader.consistency}% consistency
                </p>
              </div>
            </div>

            <div className="lb-stat-card">
              <p className="lb-eyebrow">Your position</p>
              <p className="lb-stat-value">
                #{myRank} of {standings.length}
              </p>
              <p className="lb-hint">
                {myRank === 1 ? "You're in the lead" : `${pointsBehind} points from the top`}
              </p>
            </div>

            <div className="lb-stat-card">
              <p className="lb-eyebrow">Time to make a move</p>
              <p className="lb-stat-value">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
              </p>
              <p className="lb-hint">Season closes at the end of {monthName}</p>
            </div>
          </section>

          <div className="lb-columns">
            {/* ----- Monthly standings table ----- */}
            <section className="lb-card" aria-labelledby="standings-heading">
              <div className="lb-card-header">
                <h2 id="standings-heading" className="lb-card-title">
                  {monthName} standings
                </h2>
                <span className="lb-live">
                  <span className="lb-live-dot" aria-hidden /> Updated just now
                </span>
              </div>

              <div className="lb-table-wrap">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th scope="col">Rk</th>
                      <th scope="col">Member</th>
                      <th scope="col" className="lb-hide-sm">
                        Week
                      </th>
                      <th scope="col" className="lb-hide-sm">
                        Streak
                      </th>
                      <th scope="col" className="lb-hide-sm">
                        Consistency
                      </th>
                      <th scope="col" className="lb-num">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((member, index) => {
                      const isMe = member.id === LEAGUE.currentUserId
                      return (
                        <tr key={member.id} className={isMe ? 'lb-row--me' : ''}>
                          <td className="lb-rank">{pad(index + 1)}</td>
                          <td>
                            <div className="lb-member">
                              <span className={`lb-avatar ${isMe ? 'lb-avatar--me' : ''}`} aria-hidden>
                                {initials(member.name)}
                              </span>
                              <span>
                                {member.name}
                                {isMe && <span className="lb-you">You</span>}
                              </span>
                            </div>
                          </td>
                          <td className="lb-hide-sm">
                            {member.goalDone} / {LEAGUE.weeklyGoal}
                          </td>
                          <td className="lb-hide-sm">{member.streak} days</td>
                          <td className="lb-hide-sm">
                            <div className="lb-consistency">
                              <span>{member.consistency}%</span>
                              <span className="lb-bar" aria-hidden>
                                <span style={{ width: `${member.consistency}%` }} />
                              </span>
                            </div>
                          </td>
                          <td className="lb-num lb-points">{member.points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="lb-hint">
                Consistency = days checked in ÷ days in the season so far. Streaks count daily check-ins.
              </p>
            </section>

            {/* ----- Today's race ----- */}
            <section className="lb-card" aria-labelledby="today-heading">
              <div className="lb-card-header">
                <h2 id="today-heading" className="lb-card-title">
                  Today's race
                </h2>
                <span aria-hidden className="lb-bolt">
                  ⚡
                </span>
              </div>
              <p className="lb-eyebrow">{dateLabel} · Daily points</p>

              <ol className="lb-today">
                {todaysRace.map((member, index) => {
                  const isMe = member.id === LEAGUE.currentUserId
                  return (
                    <li key={member.id} className={isMe ? 'lb-today--me' : ''}>
                      <span className="lb-today-rank">{index + 1}</span>
                      <span className="lb-today-name">
                        {firstName(member.name)}
                        {isMe && ' (you)'}
                      </span>
                      <span className="lb-today-points">{member.todayPoints}</span>
                    </li>
                  )
                })}
              </ol>
              <p className="lb-hint">Resets at midnight. Daily ties use monthly score. Your monthly points stay put.</p>
              <p className="lb-hint">Tomorrow is a fresh board. Keep showing up.</p>
            </section>
          </div>

          {/* ----- Bottom row ----- */}
          <div className="lb-bottom">
            <div className="lb-insight">
              <span aria-hidden className="lb-insight-icon">
                ↗
              </span>
              <div>
                <p className="lb-insight-title">Sam's finding a rhythm.</p>
                <p className="lb-hint">71% consistency — up 21 points since last week.</p>
              </div>
            </div>
            <div className="lb-scoring">
              <p className="lb-eyebrow">{LEAGUE.name}'s scoring</p>
              <p className="lb-hint">
                Session +40 • Weekly goal +50 • 3+ day streak check-in +25 • Group goal reached +30 each. Agreed by your
                league.
              </p>
            </div>
          </div>
        </main>

        <footer className="lb-footer">
          <span>Locked In • Show up for your people</span>
          <span>Private leagues. Shared wins.</span>
        </footer>
      </div>
    </div>
  )
}
