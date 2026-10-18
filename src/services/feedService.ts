import { apiRequest } from './apiClient'
import type { ReactionEmoji } from '../types/feed'

export type FeedPostDto = {
  id: string
  userId: number
  displayName: string
  body: string
  imageUrl: string | null
  createdAt: string
}

export type FeedReactionDto = {
  activityId: string
  userId: number
  emoji: ReactionEmoji
}

export type FeedReplyDto = {
  id: number
  activityId: string
  userId: number
  displayName: string
  body: string
  createdAt: string
}

export type FeedStateDto = {
  posts: FeedPostDto[]
  reactions: FeedReactionDto[]
  replies: FeedReplyDto[]
}

export function getFeed(leagueId: number) {
  return apiRequest<FeedStateDto>(`/leagues/${leagueId}/feed`)
}

export function createFeedPost(leagueId: number, body: string, imageUrl?: string) {
  return apiRequest<FeedPostDto>(`/leagues/${leagueId}/feed/posts`, {
    method: 'POST',
    body: JSON.stringify({ body, imageUrl: imageUrl ?? null }),
  })
}

export function toggleFeedReaction(leagueId: number, activityId: string, emoji: ReactionEmoji) {
  return apiRequest<void>(`/leagues/${leagueId}/feed/${activityId}/reaction`, {
    method: 'PUT',
    body: JSON.stringify({ emoji }),
  })
}

export function createFeedReply(leagueId: number, activityId: string, body: string) {
  return apiRequest<FeedReplyDto>(`/leagues/${leagueId}/feed/${activityId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}
