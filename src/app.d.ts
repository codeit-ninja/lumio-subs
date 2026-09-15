declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			services: import('#lib/server/services.ts').Services;
			/** Admin-authenticated PocketBase client for cache / privileged writes. */
			pocketbase: import('pocketbase').default;
			/** Per-request user PocketBase client (cookie auth). */
			userPb: import('pocketbase').default;
			user: import('#lib/auth/user.ts').AppUser | null;
		}
	}
}

export {};
