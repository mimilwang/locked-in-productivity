import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import './CreateLeague.css'
import { apiRequest } from '../services/apiClient'

// Preset choices for the stakes. "custom" lets the creator type their own.
const REWARDS = [
  { id: 'dinner', title: "Winner's dinner is covered", detail: "The crew splits the MVP's meal." },
  { id: 'cash', title: 'Cash prize', detail: 'Set a small amount together.' },
  { id: 'activity', title: 'Shared activity', detail: 'Celebrate with the whole crew.' },
]

const PUNISHMENTS = [
  { id: 'wheel', title: 'Spin the dare wheel', detail: 'Low-stakes dares, chosen by the group.' },
  { id: 'snack', title: 'Bring the next group snack', detail: 'Keep it simple and affordable.' },
]

const NAV_ITEMS = ['Overview', 'Daily check-in', 'Leaderboard', 'Monthly awards', 'Dare wheel']
const NAV_ROUTES: Record<string, string> = {
  Overview: '/overview',
  'Daily check-in': '/timer',
  Leaderboard: '/leaderboard',
  'Monthly awards': '/monthly-awards',
  'Dare wheel': '/daily-challenges',
}

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

  const [inviteEmail, setInviteEmail] = useState('')
  const [invites, setInvites] = useState<string[]>([])

  const [reward, setReward] = useState('dinner')
  const [customReward, setCustomReward] = useState('')
  const [punishment, setPunishment] = useState('wheel')
  const [customPunishment, setCustomPunishment] = useState('')
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
    const rewardText = reward === 'custom' ? customReward : REWARDS.find((r) => r.id === reward)?.title
    const punishmentText =
      punishment === 'custom' ? customPunishment : PUNISHMENTS.find((p) => p.id === punishment)?.title
    setSubmitting(true)
    setError('')
    try {
      await apiRequest('/leagues', {
        method: 'POST',
        body: JSON.stringify({
          name,
          goalDescription: goal,
          goalType: 'TASKS',
          weeklyTarget: 4,
          durationWeeks: 4,
          reward: rewardText,
          punishment: punishmentText,
        }),
      })
      window.location.assign('/overview')
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
      <aside className="cl-sidebar">
        <div className="cl-logo">
          <span aria-hidden>⚡</span> LOCKED IN
        </div>

        <p className="cl-eyebrow cl-eyebrow--dark">Your clubhouse</p>
        <a className="cl-nav-link cl-nav-link--active" href="/overview" aria-current="page">
          Your league
        </a>

        <p className="cl-eyebrow cl-eyebrow--dark">{name || 'New league'}</p>
        <nav aria-label="League">
          {NAV_ITEMS.map((item) => (
            <a key={item} className="cl-nav-link" href={NAV_ROUTES[item]}>
              {item}
            </a>
          ))}
        </nav>

        <div className="cl-sidebar-note">
          <p className="cl-eyebrow cl-eyebrow--lime">Better together</p>
          <p>A little competition. A lot of showing up.</p>
        </div>
      </aside>

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
                      <option>Sunday, 12:00 AM</option>
                    </select>
                  </div>
                </div>
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
                  You + {invites.length} invited {invites.length === 1 ? 'friend' : 'friends'}. They'll get a private
                  link when you create the league.
                </p>
              </section>

              {/* 03 Make it worth showing up */}
              <section className="cl-card" aria-labelledby="stakes-heading">
                <h2 id="stakes-heading" className="cl-card-title">
                  <span className="cl-step">03</span> Make it worth showing up
                </h2>

                <div className="cl-stakes">
                  <fieldset className="cl-fieldset">
                    <legend className="cl-eyebrow">Monthly MVP reward</legend>
                    {REWARDS.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        name="reward"
                        {...option}
                        checked={reward === option.id}
                        onSelect={setReward}
                      />
                    ))}
                    <ChoiceCard
                      name="reward"
                      id="custom"
                      title="Something else"
                      detail="Write your own reward."
                      checked={reward === 'custom'}
                      onSelect={setReward}
                    />
                    {reward === 'custom' && (
                      <input
                        className="cl-input"
                        aria-label="Custom reward"
                        value={customReward}
                        onChange={(e) => setCustomReward(e.target.value)}
                        placeholder="Loser buys boba"
                        required
                      />
                    )}
                  </fieldset>

                  <fieldset className="cl-fieldset">
                    <legend className="cl-eyebrow">Last place consequence</legend>
                    {PUNISHMENTS.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        name="punishment"
                        {...option}
                        checked={punishment === option.id}
                        onSelect={setPunishment}
                      />
                    ))}
                    <ChoiceCard
                      name="punishment"
                      id="custom"
                      title="Something else"
                      detail="Write your own consequence."
                      checked={punishment === 'custom'}
                      onSelect={setPunishment}
                    />
                    {punishment === 'custom' && (
                      <input
                        className="cl-input"
                        aria-label="Custom consequence"
                        value={customPunishment}
                        onChange={(e) => setCustomPunishment(e.target.value)}
                        placeholder="Wears a silly hat to class"
                        required
                      />
                    )}
                    <p className="cl-hint">
                      Keep it kind. Everyone can suggest dares and pass if they're uncomfortable.
                    </p>
                  </fieldset>
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
                <p>Log a session +40 • Hit your weekly goal +50 • Keep a 3+ day streak +25 per check-in</p>
                <p className="cl-hint">Example league scoring. Agree on your rules together before the season starts.</p>
              </div>

              <p className="cl-hint">
                The MVP has the highest monthly score. The lowest score earns "Chud of the Month" — and a friendly spin.
              </p>
            </aside>
          </div>

          <div className="cl-submit-bar">
            <p className="cl-hint">{error || 'Invites are private. Rewards and dares are always a group decision.'}</p>
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

// A radio button styled as a selectable card.
function ChoiceCard(props: {
  name: string
  id: string
  title: string
  detail: string
  checked: boolean
  onSelect: (id: string) => void
}) {
  const inputId = `${props.name}-${props.id}`
  return (
    <label htmlFor={inputId} className={`cl-choice ${props.checked ? 'cl-choice--selected' : ''}`}>
      <input
        id={inputId}
        type="radio"
        name={props.name}
        value={props.id}
        checked={props.checked}
        onChange={() => props.onSelect(props.id)}
      />
      <span>
        <span className="cl-choice-title">{props.title}</span>
        <span className="cl-choice-detail">{props.detail}</span>
      </span>
    </label>
  )
}
