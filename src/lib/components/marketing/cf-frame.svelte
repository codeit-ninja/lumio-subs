<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Marks = 'corners' | 'benefits' | 'pricing' | 'docs';

	let {
		children,
		marks = 'corners',
		dashed = false,
		class: className = '',
		...rest
	}: {
		children: Snippet;
		marks?: Marks;
		dashed?: boolean;
		class?: string;
	} & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class="cf-frame {dashed ? 'cf-frame-dashed' : ''} {className}" {...rest}>
	<span class="cf-mark cf-mark-tl" aria-hidden="true"></span>
	<span class="cf-mark cf-mark-tr" aria-hidden="true"></span>
	<span class="cf-mark cf-mark-bl" aria-hidden="true"></span>
	<span class="cf-mark cf-mark-br" aria-hidden="true"></span>

	{#if marks === 'benefits'}
		<span class="cf-mark cf-mark-t33 hidden sm:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-t66 hidden sm:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-b33 hidden sm:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-b66 hidden sm:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-ml hidden sm:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-mr hidden sm:block" aria-hidden="true"></span>
	{:else if marks === 'pricing'}
		<span class="cf-mark cf-mark-t1 hidden xl:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-t2 hidden xl:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-t3 hidden xl:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-b1 hidden xl:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-b2 hidden xl:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-b3 hidden xl:block" aria-hidden="true"></span>
	{:else if marks === 'docs'}
		<span class="cf-mark cf-mark-docs-split-t hidden md:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-docs-split-b hidden md:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-ml hidden md:block" aria-hidden="true"></span>
		<span class="cf-mark cf-mark-mr hidden md:block" aria-hidden="true"></span>
	{/if}

	{@render children()}
</div>
