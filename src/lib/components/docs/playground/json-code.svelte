<script lang="ts">
	import { CfFrame, CodeWindow, JsonHighlight } from '#lib/components/marketing/index.js';

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

<CfFrame class={className}>
	<CodeWindow variant="embedded" showTrafficLights={false}>
		{#snippet title()}{titleText}{/snippet}
		{#snippet titleTrailing()}{titleTrailingText}{/snippet}
		<JsonHighlight {source} class="border-0" />
	</CodeWindow>
</CfFrame>
