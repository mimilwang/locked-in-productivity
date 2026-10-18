// Small helpers for sharing a league's invite code.

const PENDING_EMAILS_KEY = 'locked-in:pending-invite-emails'

/** Opens the person's email app with the invite already written. */
export function inviteMailto(emails: string[], league: { name: string; goalDescription: string; inviteCode: string }) {
  const subject = `Join my Locked In league: ${league.name}`
  const body = [
    `I started a league on Locked In called "${league.name}".`,
    `Our goal: ${league.goalDescription}.`,
    '',
    `Join with invite code: ${league.inviteCode}`,
    'Sign in to Locked In, go to Your leagues, and enter the code under "Join".',
    '',
    'See you on the leaderboard.',
  ].join('\n')
  return `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function read(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // storage unavailable: nothing to remember
  }
}

/** Emails typed on the create-league page, handed to the invite panel after the league exists. */
export const pendingInviteEmails = {
  get: (): string[] => {
    const raw = read(PENDING_EMAILS_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((e) => typeof e === 'string') : []
    } catch {
      return []
    }
  },
  set: (emails: string[]) => write(PENDING_EMAILS_KEY, JSON.stringify(emails)),
  clear: () => write(PENDING_EMAILS_KEY, null),
}
