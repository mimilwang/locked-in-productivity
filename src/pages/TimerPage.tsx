import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { apiRequest } from '../services/apiClient'
import { cachedUser } from '../services/authService'
import { getCachedLeague, getLeagueLogs, getLeagueOverview } from '../services/leagueService'
import type { LeagueOverviewData, ProgressLog } from '../services/leagueService'
import AppSidebar from '../components/AppSidebar'

// Uploaded images come back as "/images/abc.png"; show them from the backend's address.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080'
const imageSrc = (url: string) => (url.startsWith('http') ? url : `${API_URL}${url}`)

const MAX_PHOTOS = 4
const MAX_MINUTES = 240 // the backend's longest single log
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** A log as the backend returns it, including the title and photos. */
type Activity = ProgressLog & { title: string | null; photoUrls: string[] }

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TimerPage() {
  const league = useMemo(() => getCachedLeague(), [])
  const user = useMemo(() => cachedUser(), [])
  const isTime = league?.goalType === 'TIME'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('30')
  const [date, setDate] = useState(todayIso())
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [overview, setOverview] = useState<LeagueOverviewData | null>(null)
  const [recent, setRecent] = useState<Activity[]>([])

  const totalMinutes = Math.round((Number(hours) || 0) * 60 + (Number(minutes) || 0))

  const refresh = useCallback(async () => {
    if (!league) return
    try {
      const [data, logs] = await Promise.all([getLeagueOverview(league.id), getLeagueLogs(league.id, user?.id)])
      setOverview(data)
      setRecent((logs as Activity[]).filter((log) => !log.running).slice(0, 5))
    } catch {
      // backend unreachable: the form still shows; the error appears on submit
    }
  }, [league, user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // lets the same file be picked again later
    if (!files.length) return
    setError('')
    const room = MAX_PHOTOS - photos.length
    if (files.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`)
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files.slice(0, room)) {
        if (!PHOTO_TYPES.includes(file.type)) throw new Error('Photos must be JPG, PNG or WEBP.')
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is over 5MB.`)
        const form = new FormData()
        form.append('file', file)
        const { url } = await apiRequest<{ url: string }>('/images', { method: 'POST', body: form })
        uploaded.push(url)
      }
      setPhotos((current) => [...current, ...uploaded])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload that photo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!league) return
    if (isTime && (totalMinutes < 1 || totalMinutes > MAX_MINUTES)) {
      setError(`Enter between 1 minute and ${MAX_MINUTES / 60} hours.`)
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest('/logs', {
        method: 'POST',
        body: JSON.stringify({
          leagueId: league.id,
          minutes: isTime ? totalMinutes : 0,
          date,
          title: title.trim(),
          note: description.trim() || null,
          photoUrls: photos,
        }),
      })
      setSuccess(isTime ? `Logged ${totalMinutes} minutes: ${title.trim()}` : `Task done: ${title.trim()}`)
      setTitle('')
      setDescription('')
      setPhotos([])
      setDate(todayIso())
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save your activity.')
    } finally {
      setSubmitting(false)
    }
  }

  const myWeekly = overview?.weeklyLeaderboard.find((entry) => entry.userId === user?.id)
  const weeklyPercent = myWeekly?.weeklyPercent ?? 0
  const progressAmount = overview?.myWeeklyProgress ?? 0
  const unit = isTime ? 'minutes' : 'tasks'

  if (!league) {
    return (
      <div className="timer-page">
        <style>{timerStyles}</style>
        <AppSidebar active="activity" />
        <main className="timer-main">
          <section className="timer-content">
            <div className="timer-heading">
              <h1>Pick a league first.</h1>
              <span>
                Choose a league on <a href="/overview">Your leagues</a>, then come back to log your activity.
              </span>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="timer-page">
      <style>{timerStyles}</style>

      <AppSidebar active="activity" />

      <main className="timer-main">
        <header>
          <span>{league.name.toUpperCase()} / LOG ACTIVITY</span>
          <a href="/league">Back to dashboard →</a>
        </header>

        <section className="timer-content">
          <div className="timer-heading">
            <p>LOG ACTIVITY</p>
            <h1>Show your work.</h1>
            <span>
              {isTime
                ? `${league.name} tracks time. Log how long you spent and it counts toward this week's goal.`
                : `${league.name} tracks tasks. Every activity you log counts as one task toward this week's goal.`}
            </span>
          </div>

          {success && (
            <div className="session-success" role="status">
              <span>✓</span>
              <div>
                <strong>{success}</strong>
                <small>
                  You're at {weeklyPercent}% of this week's goal ({myWeekly?.points ?? 0} pts).
                </small>
              </div>
              <a href="/leaderboard">View standings →</a>
            </div>
          )}
          {error && (
            <div className="timer-sync-error" role="alert">
              {error}
            </div>
          )}

          <div className="timer-layout">
            <form className="timer-card log-form" onSubmit={handleSubmit}>
              <div className="timer-card-top">
                <span>NEW ACTIVITY</span>
                <i>{isTime ? 'TIME GOAL' : 'TASK GOAL'}</i>
              </div>

              <label className="log-label" htmlFor="log-title">
                Title
              </label>
              <input
                id="log-title"
                className="log-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isTime ? 'Leetcode session' : 'Gym: leg day'}
                maxLength={100}
                required
              />

              {isTime ? (
                <>
                  <span className="log-label">Time spent</span>
                  <div className="log-duration">
                    <label>
                      <input
                        type="number"
                        className="log-input"
                        min={0}
                        max={4}
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        aria-label="Hours"
                      />
                      <span>hours</span>
                    </label>
                    <label>
                      <input
                        type="number"
                        className="log-input"
                        min={0}
                        max={59}
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        aria-label="Minutes"
                      />
                      <span>minutes</span>
                    </label>
                  </div>
                  <small className="log-hint">Up to 4 hours per entry. Total: {totalMinutes} minutes.</small>
                </>
              ) : (
                <small className="log-hint log-task-note">✓ This activity will count as 1 completed task.</small>
              )}

              <label className="log-label" htmlFor="log-date">
                Date
              </label>
              <input
                id="log-date"
                type="date"
                className="log-input log-date"
                value={date}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <label className="log-label" htmlFor="log-description">
                Description <em>(optional)</em>
              </label>
              <textarea
                id="log-description"
                className="log-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on? How did it go?"
                maxLength={1000}
              />

              <span className="log-label">
                Photos <em>(optional, up to {MAX_PHOTOS})</em>
              </span>
              <div className="log-photos">
                {photos.map((url) => (
                  <figure key={url}>
                    <img src={imageSrc(url)} alt="" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => setPhotos((current) => current.filter((p) => p !== url))}
                    >
                      ×
                    </button>
                  </figure>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="log-photo-add">
                    {uploading ? 'Uploading…' : '+ Add photo'}
                    <input type="file" accept={PHOTO_TYPES.join(',')} multiple onChange={handlePhotos} disabled={uploading} />
                  </label>
                )}
              </div>

              <button className="start-button log-submit" type="submit" disabled={submitting || uploading || !title.trim()}>
                {submitting ? 'Saving…' : isTime ? 'Log time →' : 'Log task →'}
              </button>
            </form>

            <aside className="session-sidebar">
              <section>
                <p className="side-label">THIS WEEK</p>
                <div className="today-score">
                  <strong>{weeklyPercent}%</strong>
                  <span>
                    of your
                    <br />
                    weekly goal
                  </span>
                </div>
                <div className="mini-progress">
                  <span style={{ width: `${weeklyPercent}%` }} />
                </div>
                <small>
                  {progressAmount} of {league.weeklyTarget} {unit}
                </small>
              </section>

              <section>
                <p className="side-label">HOW POINTS WORK</p>
                <ul>
                  <li>
                    <span>1%</span> of the goal = 1 point
                  </li>
                  <li>
                    <span>100</span> points max each week
                  </li>
                  <li>
                    <span>Mon</span> weekly reset
                  </li>
                </ul>
              </section>

              <section className="last-session">
                <p className="side-label">YOUR RECENT ACTIVITY</p>
                {recent.length === 0 ? (
                  <span>Nothing logged yet.</span>
                ) : (
                  <ol className="recent-list">
                    {recent.map((log) => (
                      <li key={log.id}>
                        <strong>{log.title || (isTime ? `${log.durationMinutes} min session` : 'Task')}</strong>
                        <span>
                          {isTime ? `${log.durationMinutes} min · ` : ''}
                          {new Date(`${log.localDate}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        {log.photoUrls?.length > 0 && (
                          <div className="recent-photos">
                            {log.photoUrls.map((url) => (
                              <img key={url} src={imageSrc(url)} alt="" />
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
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
  body { margin: 0; background: #fff9ef; }
  #root { width: 100%; max-width: none; margin: 0; border: 0; text-align: left; }
  .timer-page { min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; background: #fff9ef; color: #244452; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .timer-main { min-width: 0; }
  .timer-main > header { height: 68px; padding: 0 38px; display: flex; align-items: center; justify-content: space-between; background: #fff9ef; border-bottom: 1px solid #dddcd2; color: #737b74; font-size: 9px; letter-spacing: .08em; }
  .timer-main > header a { color: #344438; text-decoration: none; }
  .timer-content { width: min(1020px, calc(100% - 50px)); margin: 0 auto; padding: 48px 0; }
  .timer-heading { text-align: center; }
  .timer-heading p { margin: 0 0 10px; color: #8a6300; font-size: 10px; letter-spacing: .12em; }
  .timer-heading h1 { margin: 0; color: #244452; font: 800 clamp(38px, 5vw, 60px)/1 Impact, 'Arial Narrow', sans-serif; letter-spacing: .025em; }
  .timer-heading > span { margin: 12px auto 0; max-width: 560px; display: block; color: #747a74; font-size: 13px; line-height: 1.5; }
  .timer-heading a { color: #328eab; }
  .session-success { margin: 28px auto -8px; max-width: 760px; padding: 14px 17px; display: flex; align-items: center; gap: 12px; border: 1px solid #f2cfa2; border-radius: 7px; background: #ffe0d5; }
  .session-success > span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: #ffd66b; color: #244452; font-weight: 900; }
  .session-success div { flex: 1; font-size: 12px; }
  .session-success small { margin-top: 3px; display: block; color: #6e6f68; }
  .session-success a { color: #3a5488; font-size: 11px; text-decoration: none; }
  .timer-sync-error { margin: 14px auto -8px; max-width: 760px; padding: 11px 14px; border: 1px solid #e1b2aa; border-radius: 5px; background: #fff0ed; color: #8d2e21; font-size: 12px; }
  .timer-layout { margin-top: 35px; display: grid; grid-template-columns: 1fr 290px; gap: 18px; align-items: start; }
  .timer-card, .session-sidebar section { border: 1px solid #d8cfc2; border-radius: 18px; background: #fff; }
  .timer-card { padding: 26px 30px 26px; border: 0; background: #d8eff4; box-shadow: 0 8px 0 rgba(36,68,82,.12); }
  .timer-card-top { margin-bottom: 8px; display: flex; justify-content: space-between; color: #788078; font-size: 9px; letter-spacing: .1em; }
  .timer-card-top i { padding: 4px 7px; border-radius: 3px; background: #ffe0d5; color: #8a6300; font-style: normal; font-weight: 800; }
  .log-form { display: flex; flex-direction: column; }
  .log-label { margin: 16px 0 6px; color: #5e685f; font-size: 11px; font-weight: 700; }
  .log-label em { color: #8a928b; font-style: normal; font-weight: 500; }
  .log-input { width: 100%; padding: 11px 12px; border: 1px solid #d6d9d0; border-radius: 6px; background: #fdfaf2; color: #244452; font: inherit; font-size: 14px; }
  .log-input:focus { outline: 2px solid #ffd66b; outline-offset: 1px; }
  textarea.log-input { resize: vertical; }
  .log-date { max-width: 200px; }
  .log-duration { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .log-duration label { display: flex; align-items: center; gap: 8px; color: #6e6f68; font-size: 12px; }
  .log-hint { margin-top: 6px; color: #747d75; font-size: 11px; }
  .log-task-note { margin-top: 16px; padding: 10px 12px; border-radius: 6px; background: #ffe0d5; color: #8a6300; font-weight: 700; }
  .log-photos { display: flex; flex-wrap: wrap; gap: 10px; }
  .log-photos figure { position: relative; width: 92px; height: 92px; margin: 0; overflow: hidden; border-radius: 8px; border: 1px solid #d8cfc2; }
  .log-photos img { width: 100%; height: 100%; object-fit: cover; }
  .log-photos figure button { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border: 0; border-radius: 50%; background: rgba(36, 68, 82, .75); color: white; cursor: pointer; line-height: 1; }
  .log-photo-add { width: 92px; height: 92px; display: grid; place-items: center; border: 1.5px dashed #c9ccc2; border-radius: 8px; color: #6e6f68; font-size: 11px; font-weight: 700; text-align: center; cursor: pointer; }
  .log-photo-add input { display: none; }
  .start-button { border: 0; background: #328eab; color: #fff; box-shadow: 0 6px 0 #216c84; }
  .log-submit { margin-top: 24px; min-height: 50px; border-radius: 12px; font-size: 14px; font-weight: 850; cursor: pointer; }
  .log-submit:disabled { opacity: .45; cursor: not-allowed; }
  .session-sidebar { display: grid; gap: 13px; }
  .session-sidebar section { padding: 21px; }
  .session-sidebar section:nth-child(1) { background: #ff9778; border-color: #ff9778; }
  .session-sidebar section:nth-child(2) { background: #ffd66b; border-color: #ffd66b; }
  .session-sidebar section:nth-child(3) { background: #ffe0d5; border-color: #ffe0d5; }
  .side-label { margin: 0 0 17px; color: #788078; font-size: 9px; letter-spacing: .1em; }
  .today-score { display: flex; align-items: center; gap: 11px; }
  .today-score strong { color: #8a6300; font: 800 44px/1 Impact, 'Arial Narrow', sans-serif; }
  .today-score span { color: #717a72; font-size: 11px; line-height: 1.3; }
  .mini-progress { height: 6px; margin: 17px 0 8px; overflow: hidden; border-radius: 5px; background: #e1e3da; }
  .mini-progress span { height: 100%; display: block; background: #ffd66b; }
  .session-sidebar section > small { color: #747d75; font-size: 10px; }
  .session-sidebar ul { margin: 0; padding: 0; display: grid; gap: 13px; list-style: none; color: #5e685f; font-size: 11px; }
  .session-sidebar li { display: flex; align-items: center; gap: 10px; }
  .session-sidebar ul li span { width: 36px; color: #8a6300; font-weight: 900; }
  .last-session > span { color: #747d75; font-size: 11px; }
  .recent-list { margin: 0; padding: 0; display: grid; gap: 14px; list-style: none; }
  .recent-list li { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
  .recent-list strong { font-size: 12px; }
  .recent-list span { color: #747d75; font-size: 10px; }
  .recent-photos { display: flex; gap: 6px; }
  .recent-photos img { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; }
  @media (max-width: 800px) {
    .timer-page { grid-template-columns: 72px 1fr; }
    .timer-layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 580px) {
    .timer-page { display: block; }
    .timer-main > header { height: 50px; padding: 0 18px; }
    .timer-content { width: calc(100% - 30px); padding: 30px 0; }
    .timer-card { padding: 20px 17px; }
    .log-duration { grid-template-columns: 1fr; }
  }
`
