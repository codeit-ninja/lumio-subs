import { z } from 'zod'

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/

export const usersSchema = z.object({
    collectionId: z.literal('_pb_users_auth_').optional(),
    collectionName: z.string().min(1).max(255).optional(),
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    password: z.string().min(8).max(71),
    tokenKey: z.string().min(30).max(60).optional(),
    email: z.string().email(),
    emailVisibility: z.boolean().optional(),
    verified: z.boolean().optional(),
    name: z.string().max(255).optional(),
    avatar: z.string().optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const mediaIdsSchema = z.object({
    collectionId: z.literal('pbc_1604334589').optional(),
    collectionName: z.string().min(1).max(255).optional(),
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    tmdbId: z.number().int().min(1).refine((n) => n !== 0),
    imdbId: z.string().max(32).optional(),
    type: z.enum(['movie', 'tv']),
    title: z.string().max(500).optional(),
    releaseDate: z.string().regex(DATETIME_REGEX).optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const subtitleSearchesSchema = z.object({
    collectionId: z.literal('pbc_3031568985').optional(),
    collectionName: z.string().min(1).max(255).optional(),
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    imdbId: z.string().max(32).optional(),
    tmdbId: z.number().int().min(1).optional(),
    season: z.number().int().min(0).optional(),
    episode: z.number().int().min(0).optional(),
    language: z.string().min(2).max(8),
    queriedSources: z.unknown().optional(),
    mediaReleaseDate: z.string().regex(DATETIME_REGEX).optional(),
    lastFetchedAt: z.string().regex(DATETIME_REGEX),
    expiresAt: z.string().regex(DATETIME_REGEX).optional(),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

export const subtitlesSchema = z.object({
    collectionId: z.literal('pbc_3272748830').optional(),
    collectionName: z.string().min(1).max(255).optional(),
    id: z.string().regex(/^[a-z0-9]+$/).length(15).optional(),
    search: z.string().regex(/^[a-z0-9]+$/).length(15),
    provider: z.string().min(1).max(64),
    externalId: z.string().min(1).max(256),
    language: z.string().min(2).max(8),
    format: z.string().min(1).max(16),
    release: z.string().max(500).optional(),
    fileName: z.string().max(500).optional(),
    hearingImpaired: z.boolean().optional(),
    downloadCount: z.number().int().min(0).optional(),
    hash: z.string().max(128).optional(),
    rawUrl: z.string().max(2000).optional(),
    file: z.string(),
    fetchedAt: z.string().regex(DATETIME_REGEX),
    created: z.string().regex(DATETIME_REGEX).optional(),
    updated: z.string().regex(DATETIME_REGEX).optional(),
})

