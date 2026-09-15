<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		children,
		title,
		titleTrailing,
		showTrafficLights = false,
		showCaret = false,
		variant = 'window',
		class: className = '',
		...rest
	}: {
		children: Snippet;
		title?: Snippet;
		titleTrailing?: Snippet;
		showTrafficLights?: boolean;
		showCaret?: boolean;
		variant?: 'window' | 'embedded';
		class?: string;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> = $props();

	const shellClass = $derived(
		variant === 'window'
			? 'overflow-hidden rounded-md border border-border-strong bg-[#0c0c0e] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
			: 'bg-[#0c0c0e]'
	);
</script>

<div class="code-window {shellClass} {className}" {...rest}>
	<div class="flex items-center gap-2 border-b border-border px-4 py-2.5 font-mono text-[0.7rem]">
		{#if showTrafficLights}
			<span class="size-2 rounded-full bg-border-strong" aria-hidden="true"></span>
			<span class="size-2 rounded-full bg-border-strong" aria-hidden="true"></span>
			<span class="size-2 rounded-full bg-border-strong" aria-hidden="true"></span>
		{/if}
		<div
			class="flex min-w-0 flex-1 items-center justify-between gap-3 text-muted {showTrafficLights
				? 'ml-2'
				: ''}"
		>
			<span class="min-w-0 truncate">
				{#if title}{@render title()}{/if}
				{#if showCaret}<span class="caret" aria-hidden="true"></span>{/if}
			</span>
			{#if titleTrailing}
				<span class="shrink-0 text-gray-600">{@render titleTrailing()}</span>
			{/if}
		</div>
	</div>
	{@render children()}
</div>

<style>
	.code-window :global(.json-method) {
		color: #34d399;
		font-weight: 500;
	}

	.code-window :global(.json-key) {
		color: #7dd3fc;
	}

	.code-window :global(.json-string) {
		color: #86efac;
	}

	.code-window :global(.json-number) {
		color: #fbbf24;
	}

	.code-window :global(.json-boolean) {
		color: #f9a8d4;
	}

	.code-window :global(.json-null) {
		color: #a78bfa;
	}

	.code-window :global(.json-punct) {
		color: #a1a1aa;
	}

	.caret {
		display: inline-block;
		width: 0.45em;
		height: 1em;
		margin-left: 0.15em;
		vertical-align: -0.12em;
		background: color-mix(in oklab, var(--color-primary) 80%, white);
		animation: caret-blink 1.1s step-end infinite;
	}

	@keyframes caret-blink {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.caret {
			animation: none;
		}
	}
</style>
