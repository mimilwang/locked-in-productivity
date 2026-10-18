import { useEffect, useState } from 'react'
import type { Challenge, ChallengeCompletion } from '../types/challenges'
import {
  formatCountdown,
  getDailyChallenges,
  getDateKey,
  loadCompletions,
  msUntilNextLocalMidnight,
  saveCompletions,
  totalPointsFromCompletions,
} from '../lib/dailyChallenges'
import './DailyChallengesPage.css'
import AppSidebar from '../components/AppSidebar'
import { ApiError, apiRequest } from '../services/apiClient'
import { cachedUser } from '../services/authService'
import {
  getCachedLeague,
  getLeagueLogs,
  getLeagueMembers,
} from '../services/leagueService'
import type { LeagueMember } from '../services/leagueService'

/** A log as the backend returns it, with the daily-challenge fields. */
type ChallengeLog = {
  localDate: string
  source: string
  challengeId: string | null
  note: string | null
  endedAt: string | null
  buddyUserId?: number | null
}

function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function ChallengeCard({
  challenge,
  completed,
  members,
  onComplete,
  onUndo,
}: {
  challenge: Challenge
  completed: ChallengeCompletion | undefined
  members: LeagueMember[]
  onComplete: (buddyUserId: number | null) => void
  onUndo: () => void
}) {
  const [buddyUserId, setBuddyUserId] = useState('')
  const isFun = challenge.size === 'fun'
  const needsBuddy = challenge.requiresBuddy
  const canComplete = !needsBuddy || buddyUserId !== ''

  return (
    <article
      className={`challenge-card challenge-card--${challenge.size}${
        completed ? ' challenge-card--done' : ''
      }`}
    >
      <header className="challenge-card__header">
        <span className="challenge-card__size">
          {isFun ? 'Fun-sized' : 'Party-sized'}
        </span>
        <span className="challenge-card__points">+{challenge.points} pts</span>
      </header>

      <h2 className="challenge-card__title">{challenge.title}</h2>
      <p className="challenge-card__desc">{challenge.description}</p>

      <div className="challenge-card__meta">
        <span className="challenge-card__tag">{challenge.category}</span>
        {challenge.requiresBuddy && (
          <span className="challenge-card__tag challenge-card__tag--buddy">
            League buddy
          </span>
        )}
      </div>

      {completed ? (
        <div className="challenge-card__done">
          <p className="challenge-card__done-label">Logged — points banked</p>
          {completed.note ? (
            <p className="challenge-card__done-note">{completed.note}</p>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={onUndo}>
            Undo
          </button>
        </div>
      ) : (
        <div className="challenge-card__actions">
          <label className="challenge-card__note">
            <span>
              Who did you do this with?
              {needsBuddy ? ' (required)' : ' (optional)'}
            </span>
            <select
              value={buddyUserId}
              onChange={(e) => setBuddyUserId(e.target.value)}
              required={needsBuddy}
            >
              <option value="">
                {needsBuddy ? 'Select a member…' : 'None / solo'}
              </option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canComplete}
            onClick={() =>
              onComplete(buddyUserId ? Number(buddyUserId) : null)
            }
          >
            Mark complete <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </article>
  )
}

export default function DailyChallengesPage() {
  const league = getCachedLeague()
  const leagueKey = league ? String(league.id) : 'no-league'
  const pair = getDailyChallenges(leagueKey)
  const me = cachedUser()
  const [completions, setCompletions] = useState<ChallengeCompletion[]>(() =>
    loadCompletions(leagueKey, getDateKey()),
  )
  const [members, setMembers] = useState<LeagueMember[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(msUntilNextLocalMidnight()),
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(formatCountdown(msUntilNextLocalMidnight()))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    saveCompletions(leagueKey, pair.dateKey, completions)
  }, [completions, pair.dateKey, leagueKey])

  useEffect(() => {
    if (!league) return
    getLeagueMembers(league.id)
      .then((list) =>
        setMembers(list.filter((m) => m.userId !== me?.id)),
      )
      .catch(() => setMembers([]))
  }, [league?.id, me?.id])

  // The backend is the source of truth: mark challenges you already completed today (on any device).
  useEffect(() => {
    if (!league) return
    const user = cachedUser()
    getLeagueLogs(league.id, user?.id)
      .then((logs) => {
        const done = (logs as unknown as ChallengeLog[]).filter(
          (log) =>
            log.source === 'CHALLENGE' &&
            log.localDate === pair.dateKey &&
            log.challengeId,
        )
        setCompletions(
          done.map((log) => ({
            challengeId: log.challengeId!,
            completedAt: log.endedAt ?? new Date().toISOString(),
            note: log.note ?? undefined,
          })),
        )
      })
      .catch(() => {
        // backend unreachable: keep what this device remembers
      })
  }, [league?.id, pair.dateKey])

  const funDone = completions.find((c) => c.challengeId === pair.fun.id)
  const partyDone = completions.find((c) => c.challengeId === pair.party.id)
  const pointsToday = totalPointsFromCompletions(completions, pair)
  const completedCount = [funDone, partyDone].filter(Boolean).length

  function markDone(challengeId: string, note?: string) {
    setCompletions((prev) => {
      if (prev.some((c) => c.challengeId === challengeId)) return prev
      return [
        ...prev,
        {
          challengeId,
          completedAt: new Date().toISOString(),
          note: note || undefined,
        },
      ]
    })
  }

  /** Saves the challenge to the league: bonus points on top + a completed activity on the leaderboard. */
  async function completeChallenge(
    challenge: Challenge,
    buddyUserId: number | null,
  ) {
    if (!league || saving) return
    if (challenge.requiresBuddy && buddyUserId == null) {
      setError('Pick a league member you did this with.')
      return
    }
    setSaving(challenge.id)
    setError('')
    const buddyName = buddyUserId
      ? members.find((m) => m.userId === buddyUserId)?.displayName
      : undefined
    const note = buddyName ? `with ${buddyName}` : undefined
    try {
      await apiRequest(`/leagues/${league.id}/challenges/complete`, {
        method: 'POST',
        body: JSON.stringify({
          challengeId: challenge.id,
          title: challenge.title,
          points: challenge.points,
          buddyUserId,
        }),
      })
      markDone(challenge.id, note)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409)
        markDone(challenge.id, note) // already counted
      else
        setError(
          caught instanceof Error
            ? caught.message
            : 'Could not save that challenge.',
        )
    } finally {
      setSaving(null)
    }
  }

  async function undoChallenge(challengeId: string) {
    if (!league || saving) return
    setSaving(challengeId)
    setError('')
    try {
      await apiRequest(
        `/leagues/${league.id}/challenges/${encodeURIComponent(challengeId)}`,
        { method: 'DELETE' },
      )
      setCompletions((prev) => prev.filter((c) => c.challengeId !== challengeId))
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setCompletions((prev) =>
          prev.filter((c) => c.challengeId !== challengeId),
        )
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Could not undo that challenge.',
        )
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="app-page-with-sidebar">
      <AppSidebar active="challenges" />
      <main className="daily-challenges">
        <div className="daily-challenges__shell">
          <header className="daily-challenges__hero">
            <p className="daily-challenges__step">DAILY BOOST · TODAY</p>
            <h1 className="daily-challenges__title">Daily challenges</h1>
            <p className="daily-challenges__subtitle">
              Two ways to boost your score today — one casual, one all-in. Build
              community and wellbeing beyond your league goal.
            </p>

            <div className="daily-challenges__stats">
              <div>
                <span className="daily-challenges__stat-label">League</span>
                <span className="daily-challenges__stat-value">
                  {league?.name ?? 'No league picked'}
                </span>
              </div>
              <div>
                <span className="daily-challenges__stat-label">Today</span>
                <span className="daily-challenges__stat-value">
                  {formatDisplayDate(pair.dateKey)}
                </span>
              </div>
              <div>
                <span className="daily-challenges__stat-label">Resets in</span>
                <span className="daily-challenges__stat-value daily-challenges__countdown">
                  {countdown}
                </span>
              </div>
            </div>
          </header>

          {!league && (
            <p className="daily-challenges__error" role="status">
              Pick a league on <a href="/overview">Your leagues</a> so your
              challenge points count.
            </p>
          )}
          {error && (
            <p className="daily-challenges__error" role="alert">
              {error}
            </p>
          )}

          <section className="daily-challenges__progress" aria-live="polite">
            <p>
              <strong>{completedCount}/2</strong> challenges logged ·{' '}
              <strong>+{pointsToday}</strong> pts today
            </p>
          </section>

          <section
            className="daily-challenges__grid"
            aria-label="Today's challenges"
          >
            <ChallengeCard
              challenge={pair.fun}
              completed={funDone}
              members={members}
              onComplete={(buddyUserId) =>
                void completeChallenge(pair.fun, buddyUserId)
              }
              onUndo={() => void undoChallenge(pair.fun.id)}
            />
            <ChallengeCard
              challenge={pair.party}
              completed={partyDone}
              members={members}
              onComplete={(buddyUserId) =>
                void completeChallenge(pair.party, buddyUserId)
              }
              onUndo={() => void undoChallenge(pair.party.id)}
            />
          </section>

          <footer className="daily-challenges__footer">
            <p>
              Challenges rotate at midnight. Bonus points go on top of your weekly
              goal score and show on the leaderboard. Completions are
              self-reported, so keep it honest.
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}
