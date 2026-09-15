import { z } from 'zod';

export const searchQuerySchema = z
	.object({
		imdb: z
			.string()
			.regex(/^tt\d+$/i)
			.optional(),
		tmdb: z.coerce.number().int().positive().optional(),
		s: z.coerce.number().int().min(0).optional(),
		e: z.coerce.number().int().min(0).optional(),
		lang: z.string().min(2).max(8).default('en'),
		type: z.enum(['movie', 'tv']).optional()
	})
	.refine((v) => Boolean(v.imdb || v.tmdb), {
		message: 'Provide imdb or tmdb'
	});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const subtitleDtoSchema = z.object({
	id: z.string().min(1),
	language: z.string().min(1),
	format: z.string().min(1),
	release: z.string().nullable(),
	downloadUrl: z.string().min(1)
});

export type SubtitleDto = z.infer<typeof subtitleDtoSchema>;
