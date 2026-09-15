import { createContext } from 'svelte';

export type DocsPlayground = {
	apiKey: string;
	setApiKey: (value: string) => void;
	clearApiKey: () => void;
	maskedApiKey: string;
	authHeaders: Record<string, string>;
};

export const [useDocsPlayground, createDocsPlayground] = createContext<DocsPlayground>();

export const PLAYGROUND_API_KEY_STORAGE = 'subrest.docs.apiKey';

export function maskApiKey(key: string): string {
	const trimmed = key.trim();
	if (!trimmed) return '';
	if (trimmed.length <= 8) return '••••••••';
	return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export function readStoredApiKey(): string {
	if (typeof sessionStorage === 'undefined') return '';
	return sessionStorage.getItem(PLAYGROUND_API_KEY_STORAGE) ?? '';
}

export function writeStoredApiKey(value: string): void {
	if (typeof sessionStorage === 'undefined') return;
	const trimmed = value.trim();
	if (!trimmed) {
		sessionStorage.removeItem(PLAYGROUND_API_KEY_STORAGE);
		return;
	}
	sessionStorage.setItem(PLAYGROUND_API_KEY_STORAGE, trimmed);
}

/**
 * Reactive playground state for docs pages. Pass into `createDocsPlayground`
 * with getters so context stays reactive:
 *
 * ```ts
 * const store = new DocsPlaygroundStore(readStoredApiKey());
 * createDocsPlayground({
 *   get apiKey() { return store.apiKey; },
 *   setApiKey: store.setApiKey,
 *   clearApiKey: store.clearApiKey,
 *   get maskedApiKey() { return store.maskedApiKey; },
 *   get authHeaders() { return store.authHeaders; },
 * });
 * ```
 */
export class DocsPlaygroundStore {
	apiKey = $state('');

	constructor(initial = '') {
		this.apiKey = initial;
	}

	setApiKey = (value: string) => {
		this.apiKey = value;
		writeStoredApiKey(value);
	};

	clearApiKey = () => {
		this.apiKey = '';
		writeStoredApiKey('');
	};

	get maskedApiKey(): string {
		return maskApiKey(this.apiKey);
	}

	get authHeaders(): Record<string, string> {
		const key = this.apiKey.trim();
		return key ? { 'X-API-Key': key } : {};
	}
}
