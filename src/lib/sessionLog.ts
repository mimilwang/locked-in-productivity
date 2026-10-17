export type FocusSession = {
  id: string
  startedAt: string
  completedAt: string
  durationSeconds: number
  goalMinutes: number
  points: number
  status: 'completed'
}

const STORAGE_KEY = 'locked-in:focus-sessions'

export function getFocusSessions(): FocusSession[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as FocusSession[] : []
  } catch {
    return []
  }
}

export function saveFocusSession(session: FocusSession) {
  const sessions = getFocusSessions()

  if (sessions.some((item) => item.id === session.id)) return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...sessions]))
  window.dispatchEvent(new CustomEvent('locked-in:session-logged', { detail: session }))
}

export function createFocusSession(startedAt: Date, goalMinutes: number): FocusSession {
  const completedAt = new Date()

  return {
    id: `${startedAt.getTime()}-${goalMinutes}`,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationSeconds: goalMinutes * 60,
    goalMinutes,
    points: Math.max(10, Math.round(goalMinutes / 2)),
    status: 'completed',
  }
}
