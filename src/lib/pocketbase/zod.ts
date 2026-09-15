import { z } from 'zod';

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const usersSchema = z.object({
	collectionId: z.literal('_pb_users_auth_').optional(),
	collectionName: z.string().min(1).max(255).optional(),
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15)
		.optional(),
	password: z.string().min(8).max(71),
	tokenKey: z.string().min(30).max(60).optional(),
	email: z.string().email(),
	emailVisibility: z.boolean().optional(),
	verified: z.boolean().optional(),
	name: z.string().max(255).optional(),
	avatar: z.string().optional(),
	created: z.string().regex(DATETIME_REGEX).optional(),
	updated: z.string().regex(DATETIME_REGEX).optional(),
	stripeCustomerId: z.string().max(255).optional()
});

export const subtitlesSchema = z.object({
	collectionId: z.literal('pbc_3272748830').optional(),
	collectionName: z.string().min(1).max(255).optional(),
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15)
		.optional(),
	imdbId: z.string().max(32).optional(),
	tmdbId: z.number().int().min(1).optional(),
	mediaType: z.enum(['movie', 'tv']).optional(),
	title: z.string().max(500).optional(),
	season: z.number().int().min(0).optional(),
	episode: z.number().int().min(0).optional(),
	language: z.string().min(2).max(8),
	provider: z.string().min(1).max(64),
	externalId: z.string().min(1).max(256),
	format: z.string().min(1).max(16),
	release: z.string().max(500).optional(),
	fileName: z.string().max(500).optional(),
	hash: z.string().max(128).optional(),
	rawUrl: z.string().max(2000).optional(),
	file: z.string().optional(),
	fetchedAt: z.string().regex(DATETIME_REGEX),
	created: z.string().regex(DATETIME_REGEX).optional(),
	updated: z.string().regex(DATETIME_REGEX).optional()
});

export const plansSchema = z.object({
	collectionId: z.literal('pbc_4263585338').optional(),
	collectionName: z.string().min(1).max(255).optional(),
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15)
		.optional(),
	name: z.string().min(1).max(120),
	description: z.string().max(1000).optional(),
	features: z.unknown().optional(),
	priceCents: z.number().int().min(0).optional(),
	currency: z.string().min(1).max(8),
	interval: z.enum(['month', 'year']),
	stripePriceId: z.string().max(255).optional(),
	active: z.boolean().optional(),
	highlighted: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	created: z.string().regex(DATETIME_REGEX).optional(),
	updated: z.string().regex(DATETIME_REGEX).optional(),
	slug: z.string().min(1).max(64),
	limitPerSecond: z
		.number()
		.int()
		.min(1)
		.refine((n) => n !== 0),
	limitPerMinute: z
		.number()
		.int()
		.min(1)
		.refine((n) => n !== 0),
	limitPerHour: z
		.number()
		.int()
		.min(1)
		.refine((n) => n !== 0),
	limitPerDay: z
		.number()
		.int()
		.min(1)
		.refine((n) => n !== 0),
	limitPerMonth: z
		.number()
		.int()
		.min(1)
		.refine((n) => n !== 0)
});

export const subscriptionsSchema = z.object({
	collectionId: z.literal('pbc_3980638064').optional(),
	collectionName: z.string().min(1).max(255).optional(),
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15)
		.optional(),
	user: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15),
	plan: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15),
	stripeCustomerId: z.string().max(255).optional(),
	stripeSubscriptionId: z.string().max(255).optional(),
	status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid']),
	currentPeriodEnd: z.string().regex(DATETIME_REGEX).optional(),
	created: z.string().regex(DATETIME_REGEX).optional(),
	updated: z.string().regex(DATETIME_REGEX).optional()
});

export const apiKeysSchema = z.object({
	collectionId: z.literal('pbc_3577178630').optional(),
	collectionName: z.string().min(1).max(255).optional(),
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15)
		.optional(),
	user: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.length(15),
	name: z.string().min(1).max(120),
	keyPrefix: z.string().min(1).max(16),
	keyHash: z.string().min(1).max(128),
	expiresAt: z.string().regex(DATETIME_REGEX).optional(),
	revokedAt: z.string().regex(DATETIME_REGEX).optional(),
	lastUsedAt: z.string().regex(DATETIME_REGEX).optional(),
	created: z.string().regex(DATETIME_REGEX).optional(),
	updated: z.string().regex(DATETIME_REGEX).optional()
});
