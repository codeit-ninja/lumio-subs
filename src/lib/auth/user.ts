import { z } from 'zod';

export const appUserSchema = z.object({
	id: z.string().min(1),
	email: z.string().default(''),
	name: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	verified: z.boolean().default(false),
	stripeCustomerId: z
		.string()
		.nullish()
		.transform((value) => value?.trim() || null)
});

export type AppUser = z.infer<typeof appUserSchema>;

export function parseAppUser(raw: unknown): AppUser | null {
	const result = appUserSchema.safeParse(raw);
	return result.success ? result.data : null;
}
