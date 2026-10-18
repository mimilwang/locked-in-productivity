import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from './apiClient'
import type { AuthResponse, UserProfile } from '../types/api'

const USER_KEY = 'locked-in:current-user'

export type SignUpInput = {
  name: string
  displayName: string
  email: string
  password: string
  timeZone: string
  school?: string
  photoUrl?: string
}

function saveSession(response: AuthResponse) {
  setAuthToken(response.token)
  window.localStorage.removeItem('locked-in:active-league-id')
  window.localStorage.removeItem('locked-in:active-league')
  window.localStorage.setItem(USER_KEY, JSON.stringify(response.user))
  return response.user
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}

export function cachedUser(): UserProfile | null {
  try {
    const stored = window.localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) as UserProfile : null
  } catch {
    return null
  }
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return saveSession(response)
}

export async function signUp(input: SignUpInput) {
  const response = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return saveSession(response)
}

export async function getMyProfile() {
  const profile = await apiRequest<UserProfile>('/users/me')
  window.localStorage.setItem(USER_KEY, JSON.stringify(profile))
  return profile
}

export async function updateMyProfile(input: Partial<Pick<UserProfile, 'name' | 'displayName' | 'school' | 'timeZone' | 'photoUrl'>>) {
  const profile = await apiRequest<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  window.localStorage.setItem(USER_KEY, JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent('locked-in:profile-updated', { detail: profile }))
  return profile
}

export function logout() {
  clearAuthToken()
  window.localStorage.removeItem('locked-in:active-league-id')
  window.localStorage.removeItem('locked-in:active-league')
  window.location.assign('/login')
}
