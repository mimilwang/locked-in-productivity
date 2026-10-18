import { apiRequest } from './apiClient'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080'

export function resolveImageUrl(url: string) {
  return url.startsWith('http') || url.startsWith('blob:') ? url : `${API_URL}${url}`
}

export async function uploadImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Profile pictures must be JPG, PNG, or WEBP.')
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Profile pictures must be 5MB or smaller.')
  const form = new FormData()
  form.append('file', file)
  return apiRequest<{ url: string }>('/images', { method: 'POST', body: form })
}
