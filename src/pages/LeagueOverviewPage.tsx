import { useState } from 'react'

type Leader = {
  rank: number
  initials: string
  name: string
  points: number
  checkedIn: boolean
  color: string
}

const leaders: Leader[] = [
  { rank: 1, initials: 'AC', name: 'Alex Chen', points: 120, checkedIn: true, color: '#baff43' },
  { rank: 2, initials: 'MP', name: 'Maya Patel', points: 105, checkedIn: true, color: '#d9e6cb' },
  { rank: 3, initials: 'JP', name: 'Jordan Park', points: 90, checkedIn: true, color: '#f0d58a' },
  { rank: 4, initials: 'NB', name: 'Noah Brown', points: 70, checkedIn: false, color: '#d8ddd3' },
  { rank: 5, initials: 'RW', name: 'Riley Wong', points: 55, checkedIn: false, color: '#cdd7e8' },
]

const days = [
  { day: 'MON', value: 6 },
  { day: 'TUE', value: 5 },
  { day: 'WED', value: 6 },
  { day: 'THU', value: 4 },
  { day: 'FRI', value: 5 },
  { day: 'SAT', value: 3 },
  { day: 'SUN', value: 0 },
]

export default function LeagueOverviewPage() {
  const [checkedIn, setCheckedIn] = useState(false)
  const completed = checkedIn ? 18 : 17
  const weeklyPercent = Math.round((completed / 24) * 100)

  return (
    <div className="overview-page">
      <style>{pageStyles}</style>

      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Locked In home">
          <span className="brand-bolt">ϟ</span>
          <span>LOCKED IN</span>
        </a>

        <nav className="nav" aria-label="Main navigation">
          <p className="nav-label">YOUR LEAGUE</p>
          <a className="nav-link active" href="#overview"><span>▦</span> Overview</a>
          <a className="nav-link" href="#check-in"><span>✓</span> Daily check-in</a>
          <a className="nav-link" href="#leaderboard"><span>▥</span> Leaderboard</a>
          <a className="nav-link" href="#awards"><span>♕</span> Monthly awards</a>
          <a className="nav-link" href="#dare-wheel"><span>◎</span> Dare wheel</a>
        </nav>

        <div className="sidebar-note">
          <strong>BETTER TOGETHER.</strong>
          <p>A little competition. A lot of showing up.</p>
        </div>

        <div className="sidebar-profile">
          <span className="avatar avatar-green">AC</span>
          <span><strong>Alex Chen</strong><small>University of Washington</small></span>
        </div>
      </aside>

      <main className="main-shell" id="overview">
        <header className="topbar">
          <span>Clubhouse / The 8 AM Club</span>
          <div className="topbar-actions"><span>OCT 17, 2026</span><button aria-label="Notifications">♢</button><span className="avatar avatar-small avatar-green">AC</span></div>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <p className="eyebrow">THE 8 AM CLUB / OCTOBER SEASON</p>
              <h1>Lock in.</h1>
              <p className="subhead">Welcome back, Alex. Your people are showing up. You in?</p>
            </div>
            <button className={checkedIn ? 'primary-button complete' : 'primary-button'} onClick={() => setCheckedIn(true)} disabled={checkedIn}>
              {checkedIn ? 'Checked in today ✓' : 'Check in now →'}
            </button>
          </section>

          <section className="league-hero">
            <div className="league-hero-copy">
              <div className="league-meta"><span>PRIVATE LEAGUE</span><span>6 MEMBERS</span><span>WEEK 3 OF 4</span></div>
              <h2>The 8 AM Club</h2>
              <p>Four focused study sessions each week. Phones down, brains on.</p>
              <div className="member-row" aria-label="League members">
                {leaders.map((leader) => <span key={leader.name} className="avatar" style={{ background: leader.color }}>{leader.initials}</span>)}
                <span className="member-copy">Your crew is <strong>{weeklyPercent}%</strong> to this week’s goal.</span>
              </div>
            </div>
            <div className="hero-score">
              <span className="score-label">YOUR POSITION</span>
              <strong>#1</strong>
              <span>120 PTS</span>
            </div>
          </section>

          <section className="stats-strip" aria-label="Your weekly statistics">
            <article><span>YOUR STREAK</span><strong>12 <small>days</small></strong><p>Personal best: 18</p></article>
            <article><span>THIS WEEK</span><strong>3 <small>/ 4 sessions</small></strong><p>One more to hit your goal</p></article>
            <article><span>POINTS EARNED</span><strong>120</strong><p className="positive">↑ 25 from last week</p></article>
            <article><span>LEAGUE RANK</span><strong>1st</strong><p>Holding the top spot</p></article>
          </section>

          <div className="dashboard-grid">
            <section className="panel leaderboard-panel" id="leaderboard">
              <div className="panel-heading">
                <div><p className="eyebrow">TODAY · LIVE</p><h2>Daily leaderboard</h2></div>
                <a href="#full-leaderboard">Full leaderboard →</a>
              </div>
              <div className="leader-list">
                {leaders.map((leader) => (
                  <div className={leader.rank === 1 ? 'leader-row first' : 'leader-row'} key={leader.name}>
                    <span className="rank">{leader.rank.toString().padStart(2, '0')}</span>
                    <span className="avatar" style={{ background: leader.color }}>{leader.initials}</span>
                    <span className="leader-name"><strong>{leader.name}</strong><small>{leader.checkedIn ? 'Checked in today' : 'Not checked in yet'}</small></span>
                    <strong className="points">{leader.points} <small>PTS</small></strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel weekly-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">WEEKLY GOAL</p><h2>Showing up together</h2></div>
                <span className="week-badge">WEEK 3</span>
              </div>

              <div className="progress-copy">
                <div><strong>{completed} / 24</strong><span>group sessions</span></div>
                <strong>{weeklyPercent}%</strong>
              </div>
              <div className="progress-track"><span style={{ width: `${weeklyPercent}%` }} /></div>

              <div className="day-chart" aria-label="Daily group check-ins">
                {days.map((item, index) => {
                  const value = checkedIn && index === 5 ? item.value + 1 : item.value
                  return (
                    <div className="day" key={item.day}>
                      <span className="bar-wrap"><span className={index === 6 ? 'bar future' : 'bar'} style={{ height: `${Math.max(value * 12, 5)}%` }} /></span>
                      <strong>{value || '—'}</strong>
                      <small>{item.day}</small>
                    </div>
                  )
                })}
              </div>

              <div className="weekly-note"><span>ϟ</span><p><strong>6 sessions left.</strong> Everyone completes one more session and the league hits its weekly goal.</p></div>
            </section>
          </div>

          <section className="bottom-grid">
            <article className="reward-card" id="awards">
              <p className="eyebrow">OCTOBER REWARD</p>
              <h3>Winner eats free.</h3>
              <p>The league covers the MVP’s meal at the end-of-month dinner.</p>
              <span>12 days left in the season</span>
            </article>
            <article className="activity-card">
              <div className="panel-heading"><h3>Recent activity</h3><a href="#all-activity">View all →</a></div>
              <p><span className="avatar avatar-small" style={{ background: '#d9e6cb' }}>MP</span><span><strong>Maya</strong> completed a focus session<small>12 minutes ago · +25 pts</small></span></p>
              <p><span className="avatar avatar-small" style={{ background: '#f0d58a' }}>JP</span><span><strong>Jordan</strong> reached a 7-day streak<small>1 hour ago · +15 bonus pts</small></span></p>
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
  body { margin: 0; background: #f5f4ec; }
  #root { width: 100%; max-width: none; margin: 0; border: 0; text-align: left; }
  .overview-page { min-height: 100vh; display: grid; grid-template-columns: 230px 1fr; color: #17231b; background: #f5f4ec; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .sidebar { position: sticky; top: 0; height: 100vh; padding: 30px 23px 24px; display: flex; flex-direction: column; background: #13271d; color: #dce6dd; }
  .brand { display: flex; align-items: center; gap: 10px; color: white; text-decoration: none; font: 800 21px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .04em; }
  .brand-bolt { color: #baff43; font-size: 29px; }
  .nav { margin-top: 44px; }
  .nav-label, .eyebrow { margin: 0 0 11px; color: #737c75; font-size: 10px; letter-spacing: .06em; }
  .nav-link { margin: 5px 0; padding: 12px 13px; display: flex; gap: 13px; align-items: center; border-radius: 6px; color: #aebbb1; font-size: 13px; text-decoration: none; }
  .nav-link span { width: 17px; text-align: center; font-size: 17px; }
  .nav-link.active { background: #baff43; color: #13271d; font-weight: 700; }
  .sidebar-note { margin-top: auto; padding: 17px; border: 1px solid #405247; border-radius: 6px; }
  .sidebar-note strong { color: #baff43; font-size: 10px; letter-spacing: .05em; }
  .sidebar-note p { margin: 8px 0 0; color: #aebbb1; font-size: 12px; line-height: 1.45; }
  .sidebar-profile { margin-top: 32px; display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .sidebar-profile small { display: block; color: #91a096; margin-top: 3px; font-size: 9px; }
  .avatar { width: 32px; height: 32px; flex: 0 0 auto; display: inline-grid; place-items: center; border-radius: 50%; color: #223020; font-size: 10px; border: 2px solid #f5f4ec; }
  .avatar-green { background: #baff43; }
  .avatar-small { width: 30px; height: 30px; font-size: 9px; }
  .main-shell { min-width: 0; }
  .topbar { height: 68px; padding: 0 35px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dddcd2; color: #6f7770; font-size: 11px; }
  .topbar-actions { display: flex; align-items: center; gap: 20px; font-size: 9px; letter-spacing: .04em; }
  .topbar-actions button { border: 0; background: none; font-size: 20px; color: #17231b; cursor: pointer; }
  .content { padding: 38px 40px 20px; max-width: 1350px; margin: 0 auto; }
  .welcome { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
  .welcome h1 { margin: 0 0 7px; color: #17231b; font: 800 clamp(35px, 4vw, 56px)/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .015em; }
  .subhead { margin: 0; color: #747a74; font-size: 13px; }
  .primary-button { padding: 14px 20px; border: 0; border-radius: 5px; background: #baff43; color: #17231b; font-weight: 800; cursor: pointer; white-space: nowrap; }
  .primary-button.complete { background: #dce8cd; color: #476044; cursor: default; }
  .league-hero { min-height: 230px; display: grid; grid-template-columns: 1fr 260px; overflow: hidden; border-radius: 8px; background: #13271d; color: white; }
  .league-hero-copy { padding: 34px; }
  .league-meta { display: flex; gap: 22px; color: #baff43; font-size: 9px; letter-spacing: .08em; }
  .league-hero h2 { margin: 25px 0 10px; color: white; font: 800 35px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .03em; }
  .league-hero p { color: #b6c1b9; font-size: 13px; }
  .member-row { margin-top: 32px; display: flex; align-items: center; }
  .member-row .avatar + .avatar { margin-left: -8px; }
  .member-copy { margin-left: 14px; color: #acb7af; font-size: 11px; }
  .member-copy strong { color: white; }
  .hero-score { padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #baff43; color: #17231b; }
  .hero-score strong { font: 800 80px/1 Impact, 'Arial Narrow', sans-serif; }
  .hero-score > span:last-child { margin-top: 7px; font-weight: 900; font-size: 12px; }
  .score-label { margin-bottom: 10px; font-size: 9px; letter-spacing: .13em; }
  .stats-strip { margin: 18px 0; display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #dbddd2; border-radius: 7px; background: #fff; }
  .stats-strip article { padding: 20px 22px; border-right: 1px solid #e3e4dc; }
  .stats-strip article:last-child { border: 0; }
  .stats-strip article > span { color: #7b827b; font-size: 9px; letter-spacing: .08em; }
  .stats-strip strong { margin: 7px 0 3px; display: block; font: 800 28px/1 Impact, 'Arial Narrow', sans-serif; }
  .stats-strip strong small { font: 500 11px/1 Inter, sans-serif; }
  .stats-strip p { color: #7b827b; font-size: 10px; }
  .stats-strip p.positive { color: #527929; }
  .dashboard-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 18px; }
  .panel { padding: 25px; border: 1px solid #dbddd2; border-radius: 7px; background: #fff; }
  .panel-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
  .panel-heading h2, .panel-heading h3 { margin: 0; color: #17231b; font: 800 24px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .025em; }
  .panel-heading a { color: #344438; font-size: 10px; text-decoration: none; }
  .panel-heading .eyebrow { color: #75a424; }
  .leader-list { margin-top: 17px; }
  .leader-row { min-height: 58px; padding: 10px 7px; display: flex; align-items: center; gap: 11px; border-top: 1px solid #ecece7; }
  .leader-row.first { margin: 0 -8px; padding-inline: 15px; border: 0; border-radius: 5px; background: #eff9da; }
  .rank { width: 20px; color: #8a928b; font: 700 11px/1 monospace; }
  .leader-name { flex: 1; font-size: 11px; }
  .leader-name small { display: block; margin-top: 3px; color: #8a928b; font-size: 9px; }
  .points { font-size: 14px; }
  .points small { font-size: 8px; }
  .week-badge { padding: 6px 8px; border-radius: 3px; background: #eff9da; color: #5f7a30; font-size: 9px; font-weight: 800; }
  .progress-copy { margin: 27px 0 8px; display: flex; justify-content: space-between; align-items: end; }
  .progress-copy div strong { font: 800 26px/1 Impact, 'Arial Narrow', sans-serif; }
  .progress-copy div span { margin-left: 8px; color: #7a817b; font-size: 10px; }
  .progress-track { height: 7px; overflow: hidden; border-radius: 8px; background: #e1e3da; }
  .progress-track span { height: 100%; display: block; border-radius: inherit; background: #baff43; transition: width .35s ease; }
  .day-chart { height: 150px; margin: 27px 0 18px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; align-items: end; }
  .day { height: 100%; display: grid; grid-template-rows: 1fr auto auto; gap: 5px; text-align: center; }
  .bar-wrap { display: flex; align-items: flex-end; justify-content: center; }
  .bar { width: 70%; display: block; border-radius: 3px 3px 0 0; background: #253c2e; }
  .bar.future { background: #e2e4dc; }
  .day strong { font-size: 10px; }
  .day small { color: #8a928b; font-size: 8px; }
  .weekly-note { padding: 12px; display: flex; gap: 11px; align-items: center; border-radius: 5px; background: #f2f7e8; color: #536052; }
  .weekly-note > span { color: #75a424; font-size: 22px; }
  .weekly-note p { font-size: 10px; line-height: 1.45; }
  .bottom-grid { margin-top: 18px; display: grid; grid-template-columns: .8fr 1.2fr; gap: 18px; }
  .reward-card, .activity-card { padding: 23px; border: 1px solid #dbddd2; border-radius: 7px; background: #fff; }
  .reward-card { background: #e8efdc; }
  .reward-card h3, .activity-card h3 { margin: 7px 0 9px; color: #17231b; font: 800 23px/1 Impact, 'Arial Narrow', sans-serif; }
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
    .topbar-actions { margin-left: auto; }
    .content { padding: 28px 18px 18px; }
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
