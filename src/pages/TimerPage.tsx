import { useEffect, useMemo, useRef, useState } from 'react'
import { createFocusSession, getFocusSessions, saveFocusSession } from '../lib/sessionLog'
import type { FocusSession } from '../lib/sessionLog'
import { apiRequest } from '../services/apiClient'
import { getActiveLeagueId } from '../services/leagueService'
import AppSidebar from '../components/AppSidebar'

const presets = [25, 45, 60]

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function TimerPage() {
  const [goalMinutes, setGoalMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(goalMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [lastSession, setLastSession] = useState<FocusSession | null>(() => getFocusSessions()[0] ?? null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [syncError, setSyncError] = useState('')
  const deadlineRef = useRef<number | null>(null)
  const loggedRef = useRef(false)

  const progress = useMemo(
    () => Math.min(100, Math.max(0, ((goalMinutes * 60 - secondsLeft) / (goalMinutes * 60)) * 100)),
    [goalMinutes, secondsLeft],
  )

  const logCompletedSession = () => {
    if (loggedRef.current) return
    const session = createFocusSession(startedAt ?? new Date(Date.now() - goalMinutes * 60 * 1000), goalMinutes)
    saveFocusSession(session)
    loggedRef.current = true
    setLastSession(session)
    setShowSuccess(true)
    setIsRunning(false)

    const leagueId = getActiveLeagueId()
    if (leagueId) {
      void apiRequest('/logs', {
        method: 'POST',
        body: JSON.stringify({ leagueId, minutes: goalMinutes, note: 'Focus timer session' }),
      }).catch((caught) => setSyncError(caught instanceof Error ? caught.message : 'Session saved on this device but could not sync.'))
    }
  }

  useEffect(() => {
    if (!isRunning || deadlineRef.current === null) return

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current! - Date.now()) / 1000))
      setSecondsLeft(remaining)

      if (remaining === 0) logCompletedSession()
    }

    updateTimer()
    const interval = window.setInterval(updateTimer, 250)
    return () => window.clearInterval(interval)
  })

  const startOrPause = () => {
    setShowSuccess(false)

    if (isRunning) {
      setIsRunning(false)
      deadlineRef.current = null
      return
    }

    if (!startedAt) setStartedAt(new Date())
    deadlineRef.current = Date.now() + secondsLeft * 1000
    setIsRunning(true)
  }

  const reset = (minutes = goalMinutes) => {
    setIsRunning(false)
    setGoalMinutes(minutes)
    setSecondsLeft(minutes * 60)
    setStartedAt(null)
    setShowSuccess(false)
    deadlineRef.current = null
    loggedRef.current = false
  }

  return (
    <div className="timer-page">
      <style>{timerStyles}</style>

      <AppSidebar active="activity" />

      <main className="timer-main">
        <header><span>THE 8 AM CLUB / FOCUS SESSION</span><a href="/overview">Back to overview →</a></header>

        <section className="timer-content">
          <div className="timer-heading">
            <p>DAILY CHECK-IN</p>
            <h1>Lock in. Get it done.</h1>
            <span>Finish your session and your progress logs automatically.</span>
          </div>

          {showSuccess && (
            <div className="session-success" role="status">
              <span>✓</span>
              <div><strong>Session complete — progress logged!</strong><small>+{lastSession?.points} points added to today’s score.</small></div>
              <a href="/leaderboard">View standings →</a>
            </div>
          )}
          {syncError && <div className="timer-sync-error" role="alert">{syncError}</div>}

          <div className="timer-layout">
            <section className="timer-card">
              <div className="timer-card-top"><span>FOCUS TIMER</span><i>{isRunning ? 'LIVE' : 'READY'}</i></div>

              <div className="timer-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>
                <div>
                  <span>{isRunning ? 'SESSION IN PROGRESS' : secondsLeft === 0 ? 'COMPLETE' : 'READY TO FOCUS'}</span>
                  <strong>{formatTime(secondsLeft)}</strong>
                  <small>{goalMinutes} MINUTE GOAL</small>
                </div>
              </div>

              <div className="preset-row" aria-label="Timer duration">
                {presets.map((minutes) => (
                  <button key={minutes} className={goalMinutes === minutes ? 'selected' : ''} onClick={() => reset(minutes)} disabled={isRunning}>
                    {minutes} MIN
                  </button>
                ))}
              </div>

              <div className="timer-actions">
                <button className="reset-button" onClick={() => reset()} disabled={secondsLeft === goalMinutes * 60}>Reset</button>
                <button className="start-button" onClick={startOrPause} disabled={secondsLeft === 0}>
                  {isRunning ? 'Pause session' : startedAt ? 'Resume session' : 'Start session'}
                </button>
              </div>

              <p className="auto-log-note"><span>●</span> Your session is saved automatically when the timer reaches zero.</p>
            </section>

            <aside className="session-sidebar">
              <section>
                <p className="side-label">TODAY’S PROGRESS</p>
                <div className="today-score"><strong>{lastSession ? 1 : 0}</strong><span>session<br />completed</span></div>
                <div className="mini-progress"><span style={{ width: lastSession ? '25%' : '0%' }} /></div>
                <small>{lastSession ? '1 of 4 weekly sessions' : 'Complete a session to check in'}</small>
              </section>

              <section>
                <p className="side-label">WHEN YOU FINISH</p>
                <ul>
                  <li><span>+{Math.max(10, Math.round(goalMinutes / 2))}</span> focus points</li>
                  <li><span>+1</span> weekly session</li>
                  <li><span>✓</span> daily check-in</li>
                </ul>
              </section>

              <section className="last-session">
                <p className="side-label">LAST SESSION</p>
                {lastSession ? (
                  <div><strong>{lastSession.goalMinutes} min focus</strong><span>{new Date(lastSession.completedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                ) : <span>No completed sessions yet.</span>}
              </section>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}

const timerStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f5f4ec; }
  #root { width: 100%; max-width: none; margin: 0; border: 0; text-align: left; }
  .timer-page { min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; background: #f5f4ec; color: #17231b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .timer-sidebar { position: sticky; top: 0; height: 100vh; padding: 30px 22px; display: flex; flex-direction: column; background: #13271d; border-right: 1px solid #304438; }
  .timer-brand { display: flex; gap: 9px; align-items: center; color: white; text-decoration: none; font: 800 21px/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .05em; }
  .timer-brand span { color: #baff43; font-size: 28px; }
  .timer-sidebar nav { margin-top: 55px; display: grid; gap: 6px; }
  .timer-sidebar nav a { padding: 13px; display: flex; gap: 12px; border-radius: 5px; color: #aebbb1; text-decoration: none; font-size: 12px; }
  .timer-sidebar nav a.active { background: #baff43; color: #13271d; box-shadow: none; }
  .timer-user { margin-top: auto; display: flex; gap: 10px; align-items: center; font-size: 11px; }
  .timer-user i { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; background: #baff43; color: #13271d; font-style: normal; font-size: 9px; }
  .timer-user small { margin-top: 3px; display: block; color: #91a096; }
  .timer-main { min-width: 0; }
  .timer-main > header { height: 68px; padding: 0 38px; display: flex; align-items: center; justify-content: space-between; background: #f5f4ec; border-bottom: 1px solid #dddcd2; color: #737b74; font-size: 9px; letter-spacing: .08em; }
  .timer-main > header a { color: #344438; text-decoration: none; }
  .timer-content { width: min(1020px, calc(100% - 50px)); margin: 0 auto; padding: 48px 0; }
  .timer-heading { text-align: center; }
  .timer-heading p { margin: 0 0 10px; color: #75a424; font-size: 10px; letter-spacing: .12em; }
  .timer-heading h1 { margin: 0; color: #17231b; font: 800 clamp(38px, 5vw, 60px)/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .025em; }
  .timer-heading > span { margin-top: 12px; display: block; color: #747a74; font-size: 13px; }
  .session-success { margin: 28px auto -8px; max-width: 760px; padding: 14px 17px; display: flex; align-items: center; gap: 12px; border: 1px solid #c8dca4; border-radius: 7px; background: #eff9da; }
  .session-success > span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: #baff43; color: #17231b; font-weight: 900; }
  .session-success div { flex: 1; font-size: 11px; }
  .session-success small { margin-top: 3px; display: block; color: #73806f; }
  .session-success a { color: #405a34; font-size: 10px; text-decoration: none; }
  .timer-sync-error { margin: 14px auto -8px; max-width: 760px; padding: 11px 14px; border: 1px solid #e1b2aa; border-radius: 5px; background: #fff0ed; color: #8d2e21; font-size: 10px; }
  .timer-layout { margin-top: 35px; display: grid; grid-template-columns: 1fr 280px; gap: 18px; align-items: start; }
  .timer-card, .session-sidebar section { border: 1px solid #dbddd2; border-radius: 8px; background: #fff; }
  .timer-card { padding: 26px 34px 24px; }
  .timer-card-top { display: flex; justify-content: space-between; color: #788078; font-size: 9px; letter-spacing: .1em; }
  .timer-card-top i { padding: 4px 7px; border-radius: 3px; background: #eff9da; color: #5c8424; font-style: normal; }
  .timer-ring { --progress: 0deg; width: min(310px, 78vw); aspect-ratio: 1; margin: 27px auto; padding: 9px; display: grid; place-items: center; border-radius: 50%; background: conic-gradient(#baff43 var(--progress), #e1e3da 0); box-shadow: 0 0 45px rgba(92,132,36,.08); }
  .timer-ring > div { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: #f8f8f3; box-shadow: inset 0 0 35px rgba(23,35,27,.05); }
  .timer-ring span, .timer-ring small { color: #788078; font-size: 9px; letter-spacing: .12em; }
  .timer-ring strong { margin: 12px 0 9px; font: 800 clamp(52px, 7vw, 82px)/1 monospace; letter-spacing: -.07em; }
  .preset-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .preset-row button { padding: 10px; border: 1px solid #d8dbd1; border-radius: 5px; background: #f8f8f3; color: #727a73; font-size: 9px; font-weight: 800; cursor: pointer; }
  .preset-row button.selected { border-color: #8bbd36; background: #eff9da; color: #4d7023; }
  .preset-row button:disabled { cursor: not-allowed; opacity: .55; }
  .timer-actions { margin-top: 17px; display: grid; grid-template-columns: 110px 1fr; gap: 9px; }
  .timer-actions button { min-height: 48px; border-radius: 5px; font-weight: 850; cursor: pointer; }
  .reset-button { border: 1px solid #d3d7cd; background: transparent; color: #626b63; }
  .start-button { border: 0; background: #baff43; color: #17231b; box-shadow: 0 0 25px rgba(139,189,54,.12); }
  .timer-actions button:disabled { opacity: .4; cursor: not-allowed; }
  .auto-log-note { margin: 15px 0 0; text-align: center; color: #747d75; font-size: 9px; }
  .auto-log-note span { color: #75a424; }
  .session-sidebar { display: grid; gap: 13px; }
  .session-sidebar section { padding: 21px; }
  .side-label { margin: 0 0 17px; color: #788078; font-size: 9px; letter-spacing: .1em; }
  .today-score { display: flex; align-items: center; gap: 11px; }
  .today-score strong { color: #75a424; font: 800 48px/1 Impact, 'Arial Narrow', sans-serif; }
  .today-score span { color: #717a72; font-size: 11px; line-height: 1.3; }
  .mini-progress { height: 6px; margin: 17px 0 8px; overflow: hidden; border-radius: 5px; background: #e1e3da; }
  .mini-progress span { height: 100%; display: block; background: #baff43; }
  .session-sidebar section > small { color: #747d75; font-size: 9px; }
  .session-sidebar ul { margin: 0; padding: 0; display: grid; gap: 13px; list-style: none; color: #5e685f; font-size: 11px; }
  .session-sidebar li { display: flex; align-items: center; gap: 10px; }
  .session-sidebar li span { width: 33px; color: #75a424; font-weight: 900; }
  .last-session div { display: flex; flex-direction: column; gap: 5px; }
  .last-session div strong { font-size: 12px; }
  .last-session div span, .last-session > span { color: #747d75; font-size: 9px; }
  @media (max-width: 800px) {
    .timer-page { grid-template-columns: 72px 1fr; }
    .timer-sidebar { padding: 24px 11px; align-items: center; }
    .timer-brand { font-size: 0; }
    .timer-brand span { font-size: 28px; }
    .timer-sidebar nav a span, .timer-user span { display: none; }
    .timer-sidebar nav a { justify-content: center; font-size: 17px; }
    .timer-layout { grid-template-columns: 1fr; }
    .session-sidebar { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 580px) {
    .timer-page { display: block; }
    .timer-sidebar { position: static; width: 100%; height: auto; padding: 14px 18px; flex-direction: row; justify-content: space-between; }
    .timer-brand { font-size: 18px; }
    .timer-sidebar nav, .timer-user { display: none; }
    .timer-main > header { height: 50px; padding: 0 18px; }
    .timer-content { width: calc(100% - 30px); padding: 30px 0; }
    .timer-layout { margin-top: 25px; }
    .timer-card { padding: 20px 17px; }
    .session-sidebar { grid-template-columns: 1fr; }
  }
`
