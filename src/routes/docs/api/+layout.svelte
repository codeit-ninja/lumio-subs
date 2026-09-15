<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import {
		ApiKeyBar,
		createDocsPlayground,
		DocsPlaygroundStore,
		readStoredApiKey
	} from '#lib/components/docs/index.js';
	import { browser } from '$app/environment';

	let { children }: { children: Snippet } = $props();

	const store = new DocsPlaygroundStore('');

	createDocsPlayground({
		get apiKey() {
			return store.apiKey;
		},
		setApiKey: store.setApiKey,
		clearApiKey: store.clearApiKey,
		get maskedApiKey() {
			return store.maskedApiKey;
		},
		get authHeaders() {
			return store.authHeaders;
		}
	});

	onMount(() => {
		if (!browser) {return;}

		const stored = readStoredApiKey();
		if (stored) {store.setApiKey(stored);}
	});
</script>

<div class="mb-6">
	<ApiKeyBar />
</div>

{@render children()}
