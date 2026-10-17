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

const DEMO_LEAGUE = {
  id: 'league-demo-locked-in',
  name: 'Locked In Legends',
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
  onComplete,
  onUndo,
}: {
  challenge: Challenge
  completed: ChallengeCompletion | undefined
  onComplete: (note: string) => void
  onUndo: () => void
}) {
  const [note, setNote] = useState('')
  const isFun = challenge.size === 'fun'

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
            <p className="challenge-card__done-note">“{completed.note}”</p>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={onUndo}>
            Undo
          </button>
        </div>
      ) : (
        <div className="challenge-card__actions">
          {challenge.requiresBuddy && (
            <label className="challenge-card__note">
              <span>Who did you do this with? (optional)</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Alex & Jordan"
                maxLength={80}
              />
            </label>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onComplete(note.trim())}
          >
            Mark complete
          </button>
        </div>
      )}
    </article>
  )
}

export default function DailyChallengesPage() {
  const pair = getDailyChallenges(DEMO_LEAGUE.id)
  const [completions, setCompletions] = useState<ChallengeCompletion[]>(() =>
    loadCompletions(DEMO_LEAGUE.id, getDateKey()),
  )
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
    saveCompletions(DEMO_LEAGUE.id, pair.dateKey, completions)
  }, [completions, pair.dateKey])

  const funDone = completions.find((c) => c.challengeId === pair.fun.id)
  const partyDone = completions.find((c) => c.challengeId === pair.party.id)
  const pointsToday = totalPointsFromCompletions(completions, pair)
  const completedCount = [funDone, partyDone].filter(Boolean).length

  function completeChallenge(challengeId: string, note: string) {
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

  function undoChallenge(challengeId: string) {
    setCompletions((prev) => prev.filter((c) => c.challengeId !== challengeId))
  }

  return (
    <div className="daily-challenges">
      <header className="daily-challenges__hero">
        <p className="daily-challenges__brand">Locked In</p>
        <h1 className="daily-challenges__title">Daily Challenges</h1>
        <p className="daily-challenges__subtitle">
          Two ways to boost your score today — one casual, one all-in. Build
          community and wellbeing beyond your league goal.
        </p>
        <div className="daily-challenges__stats">
          <div>
            <span className="daily-challenges__stat-label">League</span>
            <span className="daily-challenges__stat-value">
              {DEMO_LEAGUE.name}
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
          onComplete={(note) => completeChallenge(pair.fun.id, note)}
          onUndo={() => undoChallenge(pair.fun.id)}
        />
        <ChallengeCard
          challenge={pair.party}
          completed={partyDone}
          onComplete={(note) => completeChallenge(pair.party.id, note)}
          onUndo={() => undoChallenge(pair.party.id)}
        />
      </section>

      <footer className="daily-challenges__footer">
        <p>
          Challenges rotate at midnight. Completions are self-reported for the
          MVP — keep it honest for the leaderboard.
        </p>
      </footer>
    </div>
  )
}
