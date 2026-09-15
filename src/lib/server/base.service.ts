import { getRequestEvent } from '$app/server';

export class Service {
	protected ctx: ReturnType<typeof getRequestEvent>;

	constructor() {
		this.ctx = getRequestEvent();
	}

	protected createRequestKey() {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	protected get pocketbase() {
		return this.ctx.locals.pocketbase;
	}
}
