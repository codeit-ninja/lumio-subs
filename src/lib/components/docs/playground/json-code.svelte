<script lang="ts">
	import { CodeWindow, JsonHighlight } from '#lib/components/marketing/index.js';

	let {
		source,
		title: titleText = 'JSON',
		titleTrailing: titleTrailingText = 'application/json',
		class: className = ''
	}: {
		source: string;
		title?: string;
		titleTrailing?: string;
		class?: string;
	} = $props();
</script>

<CodeWindow variant="embedded" class={className}>
	{#snippet title()}{titleText}{/snippet}
	{#snippet titleTrailing()}{titleTrailingText}{/snippet}
	<JsonHighlight {source} class="border-0" />
</CodeWindow>
