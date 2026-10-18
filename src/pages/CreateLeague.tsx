import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import './CreateLeague.css'
import { createLeague } from '../services/leagueService'
import AppSidebar from '../components/AppSidebar'
import { pendingInviteEmails } from '../lib/invites'

function initials(text: string) {
  return text
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export default function CreateLeague() {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [weeklyReset, setWeeklyReset] = useState('Monday, 12:00 AM')
  // TIME = target in hours (sent to the backend as minutes). TASKS = target in tasks per week.
  const [goalType, setGoalType] = useState<'TIME' | 'TASKS'>('TASKS')
  const [weeklyAmount, setWeeklyAmount] = useState('4')

  const [inviteEmail, setInviteEmail] = useState('')
  const [invites, setInvites] = useState<string[]>([])

  const [reward, setReward] = useState('')
  const [punishment, setPunishment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function addInvite() {
    const email = inviteEmail.trim().toLowerCase()
    if (!email || invites.includes(email)) return
    setInvites([...invites, email])
    setInviteEmail('')
  }

  function handleInviteKey(e: KeyboardEvent<HTMLInputElement>) {
    // Pressing Enter in the email box adds the invite instead of submitting the form.
    if (e.key === 'Enter') {
      e.preventDefault()
      addInvite()
    }
  }

  function removeInvite(email: string) {
    setInvites(invites.filter((i) => i !== email))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createLeague({
        name,
        goalDescription: goal,
        goalType,
        weeklyTarget: goalType === 'TIME' ? Math.round(Number(weeklyAmount) * 60) : Math.round(Number(weeklyAmount)),
        durationWeeks: 4,
        reward: reward.trim(),
        punishment: punishment.trim(),
      })
      // createLeague makes the new league active; open it with the invite panel ready to email these friends.
      if (invites.length) pendingInviteEmails.set(invites)
      window.location.assign('/league')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create your league.')
    } finally {
      setSubmitting(false)
    }
  }

  const memberCount = invites.length + 1 // invited friends + you

  return (
    <div className="cl-page">
      {/* ---------- Sidebar ---------- */}
      <AppSidebar active="leagues" />

      {/* ---------- Main ---------- */}
      <div className="cl-main">
        <header className="cl-topbar">
          <span>Clubhouse / Your leagues</span>
        </header>

        <form className="cl-content" onSubmit={handleSubmit}>
          <div className="cl-heading-row">
            <div>
              <p className="cl-eyebrow">New league / Set the ground rules</p>
              <h1 className="cl-title">Build your starting lineup.</h1>
              <p className="cl-subtitle">One goal for everyone. A little friendly competition. Make it yours.</p>
            </div>
            <button type="button" className="cl-btn cl-btn--ghost" onClick={() => window.location.assign('/overview')}>
              Cancel
            </button>
          </div>

          <div className="cl-columns">
            {/* ----- Left column: the form ----- */}
            <div className="cl-form-column">
              {/* 01 The basics */}
              <section className="cl-card" aria-labelledby="basics-heading">
                <h2 id="basics-heading" className="cl-card-title">
                  <span className="cl-step">01</span> The basics
                </h2>

                <label className="cl-label" htmlFor="name">
                  League name
                </label>
                <input
                  id="name"
                  className="cl-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The 8 AM Club"
                  maxLength={40}
                  required
                />

                <div className="cl-row">
                  <div className="cl-grow">
                    <label className="cl-label" htmlFor="goal">
                      Everyone's weekly goal
                    </label>
                    <input
                      id="goal"
                      className="cl-input"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="4 focused study sessions"
                      required
                    />
                  </div>
                  <div>
                    <label className="cl-label" htmlFor="reset">
                      Weekly reset
                    </label>
                    <select
                      id="reset"
                      className="cl-input"
                      value={weeklyReset}
                      onChange={(e) => setWeeklyReset(e.target.value)}
                    >
                      <option>Monday, 12:00 AM</option>
                    </select>
                  </div>
                </div>
                <div className="cl-row">
                  <div>
                    <label className="cl-label" htmlFor="goal-type">
                      Goal type
                    </label>
                    <select
                      id="goal-type"
                      className="cl-input"
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as 'TIME' | 'TASKS')}
                    >
                      <option value="TASKS">Tasks completed</option>
                      <option value="TIME">Time spent</option>
                    </select>
                  </div>
                  <div className="cl-grow">
                    <label className="cl-label" htmlFor="weekly-amount">
                      Weekly target ({goalType === 'TIME' ? 'hours' : 'tasks'} per person)
                    </label>
                    <input
                      id="weekly-amount"
                      type="number"
                      className="cl-input"
                      value={weeklyAmount}
                      onChange={(e) => setWeeklyAmount(e.target.value)}
                      min={goalType === 'TIME' ? 0.5 : 1}
                      max={goalType === 'TIME' ? 168 : 100}
                      step={goalType === 'TIME' ? 0.5 : 1}
                      required
                    />
                  </div>
                </div>
                <p className="cl-hint">
                  Everyone needs {weeklyAmount || '?'} {goalType === 'TIME' ? 'hours' : 'tasks'} a week. Hitting it = 100 points.
                </p>
                <p className="cl-hint">Private by default • 4–15 members • Monthly scores reset on the 1st</p>
              </section>

              {/* 02 Bring your people */}
              <section className="cl-card" aria-labelledby="people-heading">
                <h2 id="people-heading" className="cl-card-title">
                  <span className="cl-step">02</span> Bring your people
                </h2>

                <label className="cl-label" htmlFor="invite">
                  Invite by email
                </label>
                <div className="cl-row">
                  <input
                    id="invite"
                    type="email"
                    className="cl-input cl-grow"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={handleInviteKey}
                    placeholder="sam.w@uw.edu"
                  />
                  <button type="button" className="cl-btn cl-btn--ghost" onClick={addInvite}>
                    Add
                  </button>
                </div>

                {invites.length > 0 && (
                  <ul className="cl-chips" aria-label="Invited friends">
                    {invites.map((email) => (
                      <li key={email} className="cl-chip">
                        {email}
                        <button type="button" onClick={() => removeInvite(email)} aria-label={`Remove ${email}`}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="cl-hint">
                  You + {invites.length} invited {invites.length === 1 ? 'friend' : 'friends'}. Right after you create the
                  league, you'll get your invite code and can email it to them in one click.
                </p>
              </section>

              {/* 03 Make it worth showing up */}
              <section className="cl-card" aria-labelledby="stakes-heading">
                <h2 id="stakes-heading" className="cl-card-title">
                  <span className="cl-step">03</span> Make it worth showing up
                </h2>

                <div className="cl-stakes">
                  <div>
                    <label className="cl-label" htmlFor="reward">
                      MVP Reward
                    </label>
                    <input
                      id="reward"
                      className="cl-input"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      placeholder="Winner's dinner is on the crew"
                      maxLength={200}
                      required
                    />
                    <p className="cl-hint">What the top scorer wins at the end of the month.</p>
                  </div>

                  <div>
                    <label className="cl-label" htmlFor="punishment">
                      Chud Consequence
                    </label>
                    <input
                      id="punishment"
                      className="cl-input"
                      value={punishment}
                      onChange={(e) => setPunishment(e.target.value)}
                      placeholder="Wears a silly hat to class"
                      maxLength={200}
                      required
                    />
                    <p className="cl-hint">What last place has to do. Keep it kind and low-stakes.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* ----- Right column: live preview ----- */}
            <aside className="cl-preview-column" aria-label="League preview">
              <div className="cl-summary">
                <p className="cl-eyebrow cl-eyebrow--lime">Your league, at a glance</p>
                <p className="cl-summary-icon" aria-hidden>
                  ☀
                </p>
                <p className="cl-summary-name">{name || 'Your league'}</p>
                <p className="cl-summary-text">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}. {goal || 'One shared goal'} each week.
                </p>
                <div className="cl-avatars">
                  <span className="cl-avatar cl-avatar--you" title="You">
                    You
                  </span>
                  {invites.map((email) => (
                    <span key={email} className="cl-avatar" title={email}>
                      {initials(email)}
                    </span>
                  ))}
                </div>
                <p className="cl-summary-footer">Weekly goal resets {weeklyReset}.</p>
              </div>

              <div className="cl-card cl-points">
                <p className="cl-eyebrow">Your league's points</p>
                <p>1 point for every 1% of the weekly goal, up to 100 points a week.</p>
                <p className="cl-hint">Points update every time you log and reset each Monday. Streaks are for bragging rights.</p>
              </div>

              <p className="cl-hint">
                The MVP has the highest monthly score and wins the MVP Reward. The lowest score earns "Chud of the Month" and the Chud Consequence.
              </p>
            </aside>
          </div>

          <div className="cl-submit-bar">
            <p className="cl-hint">{error || 'Invites are private. Rewards and consequences are always a group decision.'}</p>
            <button type="submit" className="cl-btn cl-btn--primary" disabled={submitting}>
              {submitting ? 'Creating league…' : 'Create league & send invites →'}
            </button>
          </div>
        </form>

        <footer className="cl-footer">
          <span>Locked In • Show up for your people</span>
          <span>Private leagues. Shared wins.</span>
        </footer>
      </div>
    </div>
  )
}
