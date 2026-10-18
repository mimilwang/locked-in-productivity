import { useState } from 'react'
import type { League } from '../services/leagueService'
import { inviteMailto } from '../lib/invites'
import './InvitePanel.css'

const MAX_MEMBERS = 15

/** "Invite friends" button + panel: shows the league's invite code, copy buttons, and an email form. */
export default function InvitePanel({
  league,
  initialEmails = [],
  startOpen = false,
}: {
  league: League
  initialEmails?: string[]
  startOpen?: boolean
}) {
  const [open, setOpen] = useState(startOpen)
  const [emails, setEmails] = useState(initialEmails.join(', '))
  const [copied, setCopied] = useState(false)

  const spotsLeft = Math.max(0, MAX_MEMBERS - league.memberCount)
  const emailList = emails
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(league.inviteCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copy this code:', league.inviteCode)
    }
  }

  return (
    <div className="invite">
      <button type="button" className="invite__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ✉ Invite friends
      </button>

      {open && (
        <div className="invite__panel" role="dialog" aria-label="Invite friends">
          <div className="invite__head">
            <p className="invite__label">INVITE CODE</p>
            <button type="button" className="invite__close" aria-label="Close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="invite__code-row">
            <span className="invite__code">{league.inviteCode}</span>
            <button type="button" onClick={() => void copyCode()}>
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
          <p className="invite__hint">
            {spotsLeft > 0
              ? `${league.memberCount} of ${MAX_MEMBERS} members · ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`
              : 'This league is full (15 members).'}
          </p>

          <label className="invite__label" htmlFor="invite-emails">
            EMAIL AN INVITE
          </label>
          <textarea
            id="invite-emails"
            rows={2}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="sam@uw.edu, jay@uw.edu"
          />
          <a
            className={`invite__send ${emailList.length ? '' : 'invite__send--disabled'}`}
            href={emailList.length ? inviteMailto(emailList, league) : undefined}
            aria-disabled={!emailList.length}
          >
            Email {emailList.length || ''} {emailList.length === 1 ? 'invite' : 'invites'} →
          </a>
          <p className="invite__hint">Opens your email app with the invite code already written in.</p>
        </div>
      )}
    </div>
  )
}
