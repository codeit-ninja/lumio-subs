declare global {
	namespace App {
		interface Locals {
			services: import('#lib/server/services.ts').Services;
			pocketbase: import('pocketbase').PocketBase;
		}
	}
}

export {};
