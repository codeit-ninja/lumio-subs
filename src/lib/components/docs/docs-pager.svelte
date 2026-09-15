<script lang="ts">
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { getDocsAdjacent } from '#lib/docs/nav.js';
	import { page } from '$app/state';

	const adjacent = $derived(getDocsAdjacent(page.url.pathname));
</script>

{#if adjacent.prev || adjacent.next}
	<nav class="mt-auto grid grid-cols-2 border-t border-border" aria-label="Docs pagination">
		{#if adjacent.prev}
			<a
				href={adjacent.prev.href}
				class="flex flex-col gap-1 border-r border-border px-5 py-4 text-left transition-colors hover:bg-surface"
			>
				<span class="flex items-center gap-1.5 text-xs text-muted">
					<Icon icon="lucide:arrow-left" class="size-3.5 shrink-0" />
					Previous
				</span>
				<span class="text-sm font-medium text-foreground">{adjacent.prev.label}</span>
			</a>
		{:else}
			<div class="border-r border-border"></div>
		{/if}
		{#if adjacent.next}
			<a
				href={adjacent.next.href}
				class="flex flex-col items-end gap-1 px-5 py-4 text-right transition-colors hover:bg-surface"
			>
				<span class="flex items-center gap-1.5 text-xs text-muted">
					Next
					<Icon icon="lucide:arrow-right" class="size-3.5 shrink-0" />
				</span>
				<span class="text-sm font-medium text-foreground">{adjacent.next.label}</span>
			</a>
		{:else}
			<div></div>
		{/if}
	</nav>
{/if}
