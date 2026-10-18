import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../lib/liveFeed'
import AppSidebar from '../components/AppSidebar'
import Confetti from '../components/Confetti'
import InvitePanel from '../components/InvitePanel'
import { pendingInviteEmails } from '../lib/invites'
import { cachedUser } from '../services/authService'
import { getLeagueLogs, getLeagueMembers, getLeagueOverview } from '../services/leagueService'
import type { League, LeagueMember, LeagueOverviewData, ProgressLog } from '../services/leagueService'
import { resolveImageUrl } from '../services/imageService'

type Leader = {
  rank: number
  initials: string
  name: string
  points: number
  checkedIn: boolean
  color: string
  avatarUrl: string | null
}

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/** 'YYYY-MM-DD' plus n days, as 'YYYY-MM-DD'. */
function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Today's date in the browser's time zone, as 'YYYY-MM-DD'. */
function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function LeagueOverviewPage({ league, leagues, onSelectLeague }: { league: League; leagues: League[]; onSelectLeague: (league: League) => void }) {
  const [overview, setOverview] = useState<LeagueOverviewData | null>(null)
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [members, setMembers] = useState<LeagueMember[]>([])
  const user = cachedUser()
  const dashboardLeaders: Leader[] = overview?.weeklyLeaderboard.map((entry, index) => ({
    rank: entry.rank,
    initials: entry.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    name: entry.displayName,
    points: entry.points,
    checkedIn: entry.weeklyPercent > 0,
    color: ['#ffd66b', '#f3e3b0', '#f0d58a', '#d8ddd3', '#cdd7e8'][index % 5]!,
    avatarUrl: entry.avatarUrl,
  })) ?? []
  const myStanding = overview?.weeklyLeaderboard.find((entry) => entry.userId === user?.id)
  const completed = overview?.myWeeklyProgress ?? 0
  const weeklyPercent = overview ? Math.round(overview.groupGoalProgress * 100) : 0
  const targetUnit = league.goalType === 'TIME' ? 'minutes' : 'sessions'

  // Real activity only: finished logs, newest first.
  const finishedLogs = logs.filter((log) => !log.running)
  const nameOf = (userId: number) =>
    userId === user?.id ? 'You' : members.find((m) => m.userId === userId)?.displayName ?? 'A member'
  const recentLogs = [...finishedLogs]
    .sort((a, b) => new Date(b.endedAt ?? b.startedAt).getTime() - new Date(a.endedAt ?? a.startedAt).getTime())
    .slice(0, 3)
  const describeLog = (log: ProgressLog) => {
    if (log.source === 'CHALLENGE') {
      const title = log.title?.trim() || 'a daily challenge'
      const pts = log.bonusPoints ?? 0
      return pts > 0
        ? `completed “${title}” (+${pts} pts)`
        : `completed “${title}”`
    }
    return league.goalType === 'TIME'
      ? `logged ${log.durationMinutes} minutes`
      : 'completed a task'
  }

  // This week's chart: how many logs landed on each day (Mon-Sun). All zeros until someone logs.
  const today = localToday()
  const weekDays = overview
    ? DAY_NAMES.map((day, i) => {
        const date = addDays(overview.weekStart, i)
        return { day, date, value: finishedLogs.filter((log) => log.localDate === date).length, future: date > today }
      })
    : DAY_NAMES.map((day) => ({ day, date: '', value: 0, future: false }))
  const maxDay = Math.max(1, ...weekDays.map((d) => d.value))
  const weekNumber = overview
    ? Math.floor((Date.parse(`${overview.weekStart}T00:00:00Z`) - Date.parse(`${league.startDate}T00:00:00Z`)) / (7 * 864e5)) + 1
    : 1

  // Confetti the first time you see that you've hit 100% of this week's goal (once per league per week).
  const hitGoal = !!overview && overview.myWeeklyProgress >= league.weeklyTarget
  const [celebrate, setCelebrate] = useState(false)
  // Emails typed while creating this league: open the invite panel with them filled in.
  const [newLeagueEmails] = useState(() => {
    const emails = pendingInviteEmails.get()
    pendingInviteEmails.clear()
    return emails
  })
  useEffect(() => {
    if (!hitGoal || !overview) return
    const key = `locked-in:celebrated:${league.id}:${overview.weekStart}`
    try {
      if (window.localStorage.getItem(key)) return
      window.localStorage.setItem(key, '1')
    } catch {
      // storage unavailable: still celebrate
    }
    setCelebrate(true)
  }, [hitGoal, overview, league.id])

  useEffect(() => {
    getLeagueOverview(league.id).then(setOverview).catch(() => setOverview(null))
    getLeagueLogs(league.id).then(setLogs).catch(() => setLogs([]))
    getLeagueMembers(league.id).then(setMembers).catch(() => setMembers([]))
  }, [league.id])

  return (
    <div className="overview-page">
      <style>{pageStyles}</style>
      <Confetti active={celebrate} />
      {celebrate && (
        <p className="goal-hit-toast" role="status">
          🎉 You hit 100% of this week's goal!
        </p>
      )}

      <AppSidebar active="dashboard" />

      <main className="main-shell" id="overview">
        <header className="topbar">
          <span>Clubhouse / {league.name}</span>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <p className="eyebrow">{league.name.toUpperCase()} / CURRENT SEASON</p>
              <h1>Lock in.</h1>
              <p className="subhead">Welcome back, {user?.displayName || user?.name || 'player'}. Your people are showing up. You in?</p>
            </div>
            <div className="welcome-controls">
              <section className="league-switcher" aria-label="Choose active league">
                <div>
                  <span className="league-switcher__label">ACTIVE LEAGUE</span>
                  <select value={league.id} onChange={(event) => {
                    const selected = leagues.find((item) => item.id === Number(event.target.value))
                    if (selected) onSelectLeague(selected)
                  }}>
                    {leagues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
              </section>
              <div className="welcome-actions">
                <span className="league-switcher__code">JOIN CODE: <strong>{league.inviteCode}</strong></span>
                <InvitePanel key={league.id} league={league} initialEmails={newLeagueEmails} startOpen={newLeagueEmails.length > 0} />
              </div>
            </div>
          </section>

          <section className="league-hero">
            <div className="league-hero-copy">
              <div className="league-meta"><span>PRIVATE LEAGUE</span><span>{league.memberCount} MEMBERS</span></div>
              <h2>{league.name}</h2>
              <p>{league.goalDescription} · {league.weeklyTarget} {targetUnit} each week.</p>
              <div className="member-row" aria-label="League members">
                {dashboardLeaders.slice(0, 6).map((leader) => <span key={leader.name} className="avatar" style={{ background: leader.color }}>{leader.avatarUrl ? <img src={resolveImageUrl(leader.avatarUrl)} alt="" /> : leader.initials}</span>)}
                <span className="member-copy">Your crew is <strong>{weeklyPercent}%</strong> to this week’s goal.</span>
              </div>
            </div>
            <div className="hero-score">
              <span className="score-label">YOUR POSITION</span>
              <strong>#{myStanding?.rank ?? '—'}</strong>
              <span>{myStanding?.points ?? 0} PTS</span>
            </div>
          </section>

          <section className="stats-strip" aria-label="Your weekly statistics">
            <article><span>YOUR STREAK</span><strong>{user?.currentStreak ?? 0} <small>days</small></strong><p>Personal best: {user?.bestStreak ?? 0}</p></article>
            <article><span>THIS WEEK</span><strong>{completed} <small>/ {league.weeklyTarget} {targetUnit}</small></strong><p>Your progress toward the weekly goal</p></article>
            <article><span>POINTS EARNED</span><strong>{myStanding?.points ?? 0}</strong><p className="positive">Weekly score</p></article>
            <article><span>LEAGUE RANK</span><strong>#{myStanding?.rank ?? '—'}</strong><p>{myStanding?.standing === 'LEADER' ? 'Holding the top spot' : 'Keep climbing'}</p></article>
          </section>

          <div className="dashboard-grid">
            <section className="panel leaderboard-panel" id="leaderboard">
              <div className="panel-heading">
                <div><p className="eyebrow">TODAY · LIVE</p><h2>Daily leaderboard</h2></div>
                <a href="/leaderboard">Full leaderboard →</a>
              </div>
              <div className="leader-list">
                {dashboardLeaders.map((leader) => (
                  <div className={leader.rank === 1 ? 'leader-row first' : 'leader-row'} key={leader.name}>
                    <span className="rank">{leader.rank.toString().padStart(2, '0')}</span>
                    <span className="avatar" style={{ background: leader.color }}>{leader.avatarUrl ? <img src={resolveImageUrl(leader.avatarUrl)} alt="" /> : leader.initials}</span>
                    <span className="leader-name"><strong>{leader.name}</strong>{leader.checkedIn && <small>Checked in today</small>}</span>
                    <strong className="points">{leader.points} <small>PTS</small></strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel weekly-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">WEEKLY GOAL</p><h2>Showing up together</h2></div>
                <span className="week-badge">WEEK {Math.max(1, weekNumber)}</span>
              </div>

              <div className="progress-copy">
                <div><strong>{overview?.membersHitWeeklyGoal ?? 0} / {overview?.memberCount ?? league.memberCount}</strong><span>members hit the goal</span></div>
                <strong>{weeklyPercent}%</strong>
              </div>
              <div className="progress-track"><span style={{ width: `${weeklyPercent}%` }} /></div>

              <div className="day-chart" aria-label="Daily group check-ins">
                {weekDays.map((item) => (
                  <div className="day" key={item.day}>
                    <span className="bar-wrap"><span className={item.future ? 'bar future' : 'bar'} style={{ height: `${item.value ? Math.max((item.value / maxDay) * 100, 8) : 4}%` }} /></span>
                    <strong>{item.value || '—'}</strong>
                    <small>{item.day}</small>
                  </div>
                ))}
              </div>

              <div className="weekly-note"><span>ϟ</span><p>{finishedLogs.length === 0 ? <><strong>No activities yet this week.</strong> Be the first to log.</> : <><strong>{weeklyPercent}% complete.</strong> Keep showing up together to reach the group goal.</>}</p></div>
            </section>
          </div>

          <section className="bottom-grid">
            <article className="reward-card" id="awards">
              <p className="eyebrow">OCTOBER REWARD</p>
              <h3>{league.reward}</h3>
              <p>The reward chosen by your league for this season’s MVP.</p>
              <span>{overview?.daysLeft ?? '—'} days left in the season</span>
            </article>
            <article className="activity-card">
              <div className="panel-heading"><h3>Recent activity</h3><a href="/feed">View all →</a></div>
              {recentLogs.length === 0 ? (
                <p className="activity-empty">No activity yet. Log a session and it will show up here.</p>
              ) : (
                recentLogs.map((log) => (
                  <p key={log.id}>
                    <span className="avatar avatar-small" style={{ background: '#f3e3b0' }}>{members.find((member) => member.userId === log.userId)?.avatarUrl ? <img src={resolveImageUrl(members.find((member) => member.userId === log.userId)!.avatarUrl!)} alt="" /> : nameOf(log.userId).slice(0, 2).toUpperCase()}</span>
                    <span><strong>{nameOf(log.userId)}</strong> {describeLog(log)}<small>{formatRelativeTime(log.endedAt ?? log.startedAt)}</small></span>
                  </p>
                ))
              )}
            </article>
          </section>

          <footer><span>LOCKED IN · SHOW UP FOR YOUR PEOPLE</span><span>Private leagues. Shared wins.</span></footer>
        </div>
      </main>
    </div>
  )
}

const pageStyles = `
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: #fff9ef; }
  .activity-empty { color: #6e6f68; font-size: 13px; }
  .goal-hit-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1001; margin: 0; padding: 12px 20px; border-radius: 999px; background: #244452; color: #fff9ef; font-weight: 700; box-shadow: 0 8px 24px rgba(36, 68, 82, .25); }
  #root { width: 100%; max-width: none; margin: 0; border: 0; text-align: left; }
  .overview-page { min-height: 100vh; display: grid; grid-template-columns: 230px 1fr; color: #244452; background: #fff9ef; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .sidebar { position: sticky; top: 0; height: 100vh; padding: 30px 23px 24px; display: flex; flex-direction: column; background: #244452; color: #dce6dd; }
  .brand { display: flex; align-items: center; gap: 10px; color: white; text-decoration: none; font: 800 21px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .04em; }
  .brand-bolt { color: #ffd66b; font-size: 29px; }
  .nav { margin-top: 44px; }
  .nav-label, .eyebrow { margin: 0 0 11px; color: #737c75; font-size: 10px; letter-spacing: .06em; }
  .nav-link { margin: 5px 0; padding: 12px 13px; display: flex; gap: 13px; align-items: center; border-radius: 6px; color: #aebbb1; font-size: 13px; text-decoration: none; }
  .nav-link span { width: 17px; text-align: center; font-size: 17px; }
  .nav-link.active { background: #ffd66b; color: #244452; font-weight: 700; }
  .sidebar-note { margin-top: auto; padding: 17px; border: 1px solid #405247; border-radius: 6px; }
  .sidebar-note strong { color: #ffd66b; font-size: 10px; letter-spacing: .05em; }
  .sidebar-note p { margin: 8px 0 0; color: #aebbb1; font-size: 12px; line-height: 1.45; }
  .sidebar-profile { margin-top: 32px; display: flex; align-items: center; gap: 10px; color: inherit; font-size: 12px; text-decoration: none; }
  .sidebar-profile small { display: block; color: #91a096; margin-top: 3px; font-size: 9px; }
  .avatar { width: 32px; height: 32px; aspect-ratio: 1 / 1; flex: 0 0 32px; overflow: hidden; display: inline-grid; place-items: center; border-radius: 50%; color: #244452; font-size: 10px; border: 2px solid #fff9ef; }
  .avatar img { display: block; width: 100%; height: 100%; min-width: 100%; object-fit: cover; object-position: center; border-radius: inherit; clip-path: circle(50% at 50% 50%); }
  .avatar-green { background: #ffd66b; }
  .avatar-small { width: 30px; height: 30px; flex-basis: 30px; font-size: 9px; }
  .main-shell { min-width: 0; }
  .topbar { height: 68px; padding: 0 35px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dddcd2; color: #6f7770; font-size: 11px; }
  .content { padding: 38px 40px 20px; max-width: 1350px; margin: 0 auto; }
  .welcome { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
  .welcome .eyebrow { margin-bottom: 22px; }
  .welcome h1 { margin: 0 0 7px; color: #244452; font: 800 clamp(35px, 4vw, 56px)/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .015em; }
  .subhead { margin: 0; color: #747a74; font-size: 13px; }
  .welcome-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .welcome-actions { display: flex; align-items: center; gap: 10px; }
  .invite-code-chip { color: #ffd66b !important; letter-spacing: .14em; }
  .primary-button { width: 172px; height: 48px; padding: 0 20px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 12px; background: #328eab; color: #fff; font-size: 16px; line-height: 20px; font-weight: 800; cursor: pointer; white-space: nowrap; text-decoration: none; }
  .primary-button.complete { background: #ffe0d5; color: #41598a; cursor: default; }
  .league-hero { min-height: 230px; display: grid; grid-template-columns: 1fr 260px; overflow: hidden; border-radius: 20px; background: #328eab; color: white; }
  .league-hero-copy { padding: 34px; }
  .league-meta { display: flex; gap: 22px; color: #ffd66b; font-size: 9px; letter-spacing: .08em; }
  .league-hero h2 { margin: 25px 0 10px; color: white; font: 800 35px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .03em; }
  .league-hero p { color: #d8e3e5; font-size: 13px; }
  .member-row { margin-top: 32px; display: flex; align-items: center; }
  .member-row .avatar + .avatar { margin-left: -8px; }
  .member-copy { margin-left: 14px; color: #d8e3e5; font-size: 11px; }
  .member-copy strong { color: white; }
  .hero-score { padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #ff9778; color: #244452; }
  .hero-score strong { font: 800 80px/1 Impact, 'Arial Narrow', sans-serif; }
  .hero-score > span:last-child { margin-top: 7px; font-weight: 900; font-size: 12px; }
  .league-switcher { position: relative; margin: 0; padding: 0; display: flex; align-items: center; justify-content: flex-end; gap: 10px; border: 0; background: transparent; }
  .league-switcher > div { position: relative; z-index: 1; }
  .league-switcher > div:first-child { display: flex; align-items: center; gap: 12px; }
  .league-switcher .league-switcher__label { padding: 9px 12px; border-radius: 999px; background: #ffecb8; color: #244452; font-size: 10px; font-weight: 900; letter-spacing: .08em; }
  .league-switcher select { width: 172px; height: 48px; min-width: 172px; padding: 0 40px 0 15px; box-sizing: border-box; border: 2px solid #244452; border-radius: 12px; background: #fff9ef; color: #244452; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 #244452; }
  .league-switcher select:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 6px 0 #244452; }
  .league-switcher select:focus-visible { outline: 3px solid #ff9778; outline-offset: 3px; }
  .league-switcher__code { width: 172px; height: 48px; padding: 0 12px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1.5px solid #244452; border-radius: 12px; background: #ffe0d5; color: #244452; font-family: var(--font-body) !important; font-size: 12px; font-weight: 800; letter-spacing: 0; white-space: nowrap; }
  .league-switcher__code strong { color: #244452; font-family: var(--font-body) !important; font-size: 12px; letter-spacing: .04em; }
  .score-label { margin-bottom: 10px; font-size: 9px; letter-spacing: .13em; }
  .stats-strip { margin: 18px 0; display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #d8cfc2; border-radius: 7px; background: #fff; }
  .stats-strip article { padding: 20px 22px; border-right: 1px solid #e3e4dc; }
  .stats-strip article:last-child { border: 0; }
  .stats-strip article > span { color: #7b827b; font-size: 9px; letter-spacing: .08em; }
  .stats-strip strong { margin: 7px 0 3px; display: block; font: 800 28px/1 Impact, 'Arial Narrow', sans-serif; }
  .stats-strip strong small { font: 500 11px/1 Inter, sans-serif; }
  .stats-strip p { color: #7b827b; font-size: 10px; }
  .stats-strip p.positive { color: #8a6300; }
  .dashboard-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 18px; }
  .panel { padding: 25px; border: 1px solid #d8cfc2; border-radius: 7px; background: #fff; }
  .panel-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
  .panel-heading h2, .panel-heading h3 { margin: 0; color: #244452; font: 800 24px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .025em; }
  .panel-heading a { color: #344438; font-size: 10px; text-decoration: none; }
  .panel-heading .eyebrow { color: #8a6300; }
  .leader-list { margin-top: 17px; }
  .leader-row { min-height: 58px; padding: 10px 7px; display: flex; align-items: center; gap: 11px; border-top: 1px solid #ecece7; }
  .leader-row.first { margin: 0 -8px; padding-inline: 15px; border: 0; border-radius: 5px; background: #ffe0d5; }
  .rank { width: 20px; color: #8a928b; font: 700 11px/1 monospace; }
  .leader-name { flex: 1; font-size: 11px; }
  .leader-name small { display: block; margin-top: 3px; color: #8a928b; font-size: 9px; }
  .points { font-size: 14px; }
  .points small { font-size: 8px; }
  .week-badge { padding: 6px 8px; border-radius: 3px; background: #ffe0d5; color: #8a6300; font-size: 9px; font-weight: 800; }
  .progress-copy { margin: 27px 0 8px; display: flex; justify-content: space-between; align-items: end; }
  .progress-copy div strong { font: 800 26px/1 Impact, 'Arial Narrow', sans-serif; }
  .progress-copy div span { margin-left: 8px; color: #7a817b; font-size: 10px; }
  .progress-track { height: 7px; overflow: hidden; border-radius: 8px; background: #e1e3da; }
  .progress-track span { height: 100%; display: block; border-radius: inherit; background: #ffd66b; transition: width .35s ease; }
  .day-chart { height: 150px; margin: 27px 0 18px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; align-items: end; }
  .day { height: 100%; display: grid; grid-template-rows: 1fr auto auto; gap: 5px; text-align: center; }
  .bar-wrap { display: flex; align-items: flex-end; justify-content: center; }
  .bar { width: 70%; display: block; border-radius: 3px 3px 0 0; background: #328eab; }
  .bar.future { background: #e2e4dc; }
  .day strong { font-size: 10px; }
  .day small { color: #8a928b; font-size: 8px; }
  .weekly-note { padding: 12px; display: flex; gap: 11px; align-items: center; border-radius: 5px; background: #ffe0d5; color: #536052; }
  .weekly-note > span { color: #8a6300; font-size: 22px; }
  .weekly-note p { font-size: 10px; line-height: 1.45; }
  .bottom-grid { margin-top: 18px; display: grid; grid-template-columns: .8fr 1.2fr; gap: 18px; }
  .reward-card, .activity-card { padding: 23px; border: 1px solid #d8cfc2; border-radius: 7px; background: #fff; }
  .reward-card { background: #ffe0d5; }
  .reward-card h3, .activity-card h3 { margin: 7px 0 9px; color: #244452; font: 800 23px/1 Impact, 'Arial Narrow', sans-serif; }
  .reward-card > p:not(.eyebrow) { color: #697269; font-size: 11px; line-height: 1.5; }
  .reward-card > span { margin-top: 18px; display: block; font-size: 9px; font-weight: 800; }
  .activity-card > p { margin-top: 13px; display: flex; gap: 10px; align-items: center; color: #606961; font-size: 11px; }
  .activity-card > p span:last-child { display: flex; flex-direction: column; gap: 3px; }
  .activity-card small { color: #8a928b; font-size: 9px; }
  footer { padding: 45px 0 5px; display: flex; justify-content: space-between; color: #858c85; font-size: 8px; letter-spacing: .04em; }
  @media (max-width: 950px) {
    .overview-page { grid-template-columns: 76px 1fr; }
    .sidebar { padding: 25px 12px; align-items: center; }
    .brand span:last-child, .nav-label, .nav-link:not(.active) { font-size: 0; }
    .nav-link { justify-content: center; }
    .nav-link span { font-size: 18px; }
    .sidebar-note, .sidebar-profile span:last-child { display: none; }
    .dashboard-grid, .bottom-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 680px) {
    .overview-page { display: block; }
    .sidebar { position: static; width: 100%; height: auto; padding: 14px 18px; flex-direction: row; justify-content: space-between; }
    .brand span:last-child { font-size: 18px; }
    .nav, .sidebar-profile, .sidebar-note { display: none; }
    .topbar { height: 52px; padding: 0 18px; }
    .topbar > span { display: none; }
    .content { padding: 28px 18px 18px; }
    .welcome-controls { width: 100%; align-items: stretch; }
    .league-switcher { align-items: stretch; flex-direction: column; }
    .league-switcher > div:first-child { width: 100%; }
    .league-switcher select { flex: 1; min-width: 0; }
    .welcome { align-items: stretch; flex-direction: column; }
    .league-hero { grid-template-columns: 1fr; }
    .hero-score { padding: 20px; flex-direction: row; gap: 15px; }
    .hero-score strong { font-size: 44px; }
    .score-label { margin: 0; }
    .stats-strip { grid-template-columns: 1fr 1fr; }
    .stats-strip article:nth-child(2) { border-right: 0; }
    .stats-strip article:nth-child(-n+2) { border-bottom: 1px solid #e3e4dc; }
    .league-meta { flex-wrap: wrap; gap: 10px; }
    .member-copy { display: none; }
    .panel { padding: 19px; }
  }
`
