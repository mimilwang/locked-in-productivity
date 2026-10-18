import { Fragment, useEffect, useState } from 'react'
import './Leaderboard.css'
import AppSidebar from '../components/AppSidebar'
import { cachedUser } from '../services/authService'
import { getCachedLeague, getLeaderboard } from '../services/leagueService'
import type { LeaderboardEntry } from '../services/leagueService'

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
  const league = getCachedLeague()
  const user = cachedUser()

  const [standings, setStandings] = useState<LeaderboardEntry[]>([]) // this month, ranked by the backend
  const [todaysRace, setTodaysRace] = useState<LeaderboardEntry[]>([]) // points gained today
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [today] = useState(() => new Date()) // read the date once when the page loads
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const daysLeft = daysLeftInMonth(today)

  useEffect(() => {
    if (!league) {
      setLoading(false)
      return
    }
    Promise.all([getLeaderboard(league.id, 'monthly'), getLeaderboard(league.id, 'daily')])
      .then(([monthly, daily]) => {
        setStandings(monthly)
        setTodaysRace(daily)
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load the leaderboard.'))
      .finally(() => setLoading(false))
  }, [league?.id])

  const leagueName = league?.name ?? 'Your league'
  const leader = standings[0]
  const myIndex = standings.findIndex((m) => m.userId === user?.id)
  const me = myIndex >= 0 ? standings[myIndex] : null
  const myRank = myIndex + 1

  // The person one spot above you, for "X pts behind [name]".
  const nextUp = myIndex > 0 ? standings[myIndex - 1] : null
  const streakText = me ? `🔥 ${me.streak}-day streak.` : ''
  const personalStatus = !me
    ? `Log your first session to get on the board in ${leagueName}.`
    : nextUp
      ? `You're #${myRank} in ${leagueName}. ${nextUp.points - me.points} pts behind ${firstName(nextUp.displayName)}. ${streakText}`
      : `You're #1 in ${leagueName}! Keep it up! ${streakText}`

  // The bottom 3 are the Chud Zone (never including 1st place).
  const chudZoneStart = Math.max(1, standings.length - 3)
  const hitGoal = standings.filter((m) => m.weeklyPercent >= 100).length

  return (
    <div className="lb-page">
      {/* ---------- Sidebar ---------- */}
      <AppSidebar active="leaderboard" />

      {/* ---------- Main ---------- */}
      <div className="lb-main">
        <header className="lb-topbar">
          <span>Your leagues / {leagueName} / Leaderboard</span>
        </header>

        <main className="lb-content">
          <div className="lb-heading-row">
            <div>
              <p className="lb-eyebrow">
                {leagueName} / The {monthName} race
              </p>
              <h1 className="lb-title">The standings don't lie.</h1>
              <p className="lb-subtitle">Every session matters. So does coming back tomorrow.</p>
            </div>
            <span className="lb-month">{monthLabel}</span>
          </div>

          {!league ? (
            <p className="lb-status" role="status">
              Pick a league on <a href="/overview">Your leagues</a> to see its standings.
            </p>
          ) : loading ? (
            <p className="lb-status" role="status">Loading standings…</p>
          ) : error ? (
            <p className="lb-status" role="alert">{error}</p>
          ) : (
            <>
              {/* ----- Personal status ----- */}
              <p className="lb-status" role="status">
                {personalStatus}
              </p>

              {/* ----- Top stats ----- */}
              <section className="lb-stats" aria-label="Race summary">
                <div className="lb-leader-card">
                  <div className="lb-trophy" aria-hidden>
                    🏆
                    <span>NO. 1</span>
                  </div>
                  <div>
                    <p className="lb-eyebrow lb-eyebrow--lime">MVP race / Current leader</p>
                    <p className="lb-leader-name">
                      {leader ? (
                        <>
                          <span aria-label="Leader">👑</span> {leader.displayName}
                        </>
                      ) : (
                        'No leader yet'
                      )}
                    </p>
                    <p className="lb-leader-detail">
                      {leader ? `${leader.points} points · ${leader.weeklyPercent}% of this week's goal` : 'Be the first to log.'}
                    </p>
                  </div>
                </div>

                <div className="lb-stat-card">
                  <p className="lb-eyebrow">Your position</p>
                  <p className="lb-stat-value">{me ? `#${myRank} of ${standings.length}` : '—'}</p>
                  <p className="lb-hint">
                    {!me || !leader ? 'Not ranked yet' : myRank === 1 ? "You're in the lead" : `${leader.points - me.points} points from the top`}
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
                            This week
                          </th>
                          <th scope="col" className="lb-hide-sm">
                            Streak
                          </th>
                          <th scope="col" className="lb-num">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((member, index) => {
                          const isMe = member.userId === user?.id
                          const inChudZone = index >= chudZoneStart
                          const rowClass = [isMe && 'lb-row--me', inChudZone && 'lb-row--chud'].filter(Boolean).join(' ')
                          return (
                            <Fragment key={member.userId}>
                              {index === chudZoneStart && (
                                <tr className="lb-chud-divider" aria-hidden>
                                  <td colSpan={5}>
                                    <span>Chud Zone</span>
                                  </td>
                                </tr>
                              )}
                              <tr className={rowClass}>
                                <td className="lb-rank">{pad(member.rank)}</td>
                                <td>
                                  <div className="lb-member">
                                    <span className={`lb-avatar ${isMe ? 'lb-avatar--me' : ''}`} aria-hidden>
                                      {initials(member.displayName)}
                                    </span>
                                    <span>
                                      {member.displayName}
                                      {index === 0 && (
                                        <span className="lb-crown" aria-label="Leader">
                                          👑
                                        </span>
                                      )}
                                      {isMe && <span className="lb-you">You</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="lb-hide-sm">
                                  <div className="lb-consistency">
                                    <span>{member.weeklyPercent}%</span>
                                    <span className="lb-bar" aria-hidden>
                                      <span style={{ width: `${member.weeklyPercent}%` }} />
                                    </span>
                                  </div>
                                </td>
                                <td className="lb-hide-sm">
                                  {member.streak > 0 ? `🔥 ${member.streak}` : '0'} {member.streak === 1 ? 'day' : 'days'}
                                </td>
                                <td className="lb-num lb-points">{member.points}</td>
                              </tr>
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="lb-hint">
                    This week = progress toward the weekly goal (100% = 100 pts). Streaks count days in a row with a log.
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
                  <p className="lb-eyebrow">{dateLabel} · Points gained today</p>

                  <ol className="lb-today">
                    {todaysRace.map((member, index) => {
                      const isMe = member.userId === user?.id
                      return (
                        <li key={member.userId} className={isMe ? 'lb-today--me' : ''}>
                          <span className="lb-today-rank">{member.rank}</span>
                          <span className="lb-today-name">
                            {firstName(member.displayName)}
                            {index === 0 && member.points > 0 && (
                              <span className="lb-crown" aria-label="Today's leader">
                                👑
                              </span>
                            )}
                            {isMe && ' (you)'}
                          </span>
                          <span className="lb-today-points">{member.points}</span>
                        </li>
                      )
                    })}
                  </ol>
                  <p className="lb-hint">Resets at midnight. Your monthly points stay put.</p>
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
                    <p className="lb-insight-title">
                      {hitGoal} of {standings.length} hit this week's goal.
                    </p>
                    <p className="lb-hint">Everyone who reaches 100% banks the full 100 points.</p>
                  </div>
                </div>
                <div className="lb-scoring">
                  <p className="lb-eyebrow">{leagueName}'s scoring</p>
                  <p className="lb-hint">
                    1 point for every 1% of the weekly goal, up to 100 points a week. Highest monthly score is MVP; the
                    bottom of the Chud Zone is Chud of the Month.
                  </p>
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="lb-footer">
          <span>Locked In • Show up for your people</span>
          <span>Private leagues. Shared wins.</span>
        </footer>
      </div>
    </div>
  )
}
