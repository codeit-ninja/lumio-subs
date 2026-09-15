<script lang="ts">
	import { jsonTokenClass, tokenizeJson } from './tokenize-json.js';

	let {
		source,
		class: className = ''
	}: {
		source: string;
		class?: string;
	} = $props();

	const tokens = $derived(tokenizeJson(source));
</script>

<pre
	class="json-panel max-h-[min(28rem,55vh)] overflow-auto p-4 text-[0.7rem] leading-relaxed sm:text-xs sm:leading-relaxed {className}"><code
		>{#each tokens as token, i (i)}{#if token.kind === 'text'}{token.value}{:else}<span
					class={jsonTokenClass[token.kind]}>{token.value}</span
				>{/if}{/each}</code
	></pre>

<style>
	.json-panel {
		color: #71717a;
	}

	.json-key {
		color: #7dd3fc;
	}

	.json-string {
		color: #86efac;
	}

	.json-number {
		color: #fbbf24;
	}

	.json-boolean {
		color: #f9a8d4;
	}

	.json-null {
		color: #a78bfa;
	}

	.json-punct {
		color: #a1a1aa;
	}
</style>
