import type { ApiErrorBody } from '../types/api'

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')

// On a phone, "localhost" means the phone itself. During local development use the
// hostname that served the frontend so phones on the same network reach the same backend.
// Production defaults to same-origin, which works with the usual reverse-proxy setup.
export const API_URL = configuredApiUrl || (import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : window.location.origin)
const TOKEN_KEY = 'locked-in:auth-token'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem('locked-in:current-user')
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach the Locked In server. Start the backend on port 8080 and try again.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody
    if (response.status === 401) clearAuthToken()
    throw new ApiError(response.status, body.message ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
