<script lang="ts">
	import type { Snippet } from 'svelte';

	import { DocsPager, DocsSidebar } from '#lib/components/docs/index.js';
	import { CfFrame } from '#lib/components/marketing/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	let mobileNavOpen = $state(false);

	const isApi = $derived(
		page.url.pathname === '/docs/api' || page.url.pathname.startsWith('/docs/api/')
	);

	afterNavigate(() => {
		mobileNavOpen = false;
	});
</script>

<div class="marketing-home px-4">
	<CfFrame
		marks="docs"
		class="mx-auto flex min-h-[calc(100dvh-3.25rem)] w-full {isApi ? 'max-w-7xl' : 'max-w-6xl'}"
	>
		<aside class="hidden w-52 shrink-0 border-r border-border md:block lg:w-56">
			<div class="sticky top-[3.25rem] py-8 pr-6 pl-4">
				<DocsSidebar />
			</div>
		</aside>

		<div class="flex min-w-0 flex-1 flex-col">
			<div class="flex-1 px-6 py-8 sm:px-8">
				<div class="mb-6 md:hidden">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={() => (mobileNavOpen = !mobileNavOpen)}
						aria-expanded={mobileNavOpen}
						aria-controls="docs-mobile-nav"
					>
						<Icon icon="lucide:menu" class="size-4 shrink-0" />
						{mobileNavOpen ? 'Hide menu' : 'Docs menu'}
					</Button>
					{#if mobileNavOpen}
						<div id="docs-mobile-nav" class="mt-3 border border-border bg-surface p-3">
							<DocsSidebar />
						</div>
					{/if}
				</div>

				<article class="docs-prose w-full {isApi ? 'max-w-none' : 'max-w-3xl'}">
					{@render children()}
				</article>
			</div>

			<DocsPager />
		</div>
	</CfFrame>
</div>

<style>
	:global(.docs-prose h1) {
		font-size: 1.875rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.2;
		margin-bottom: 0.75rem;
	}

	:global(.docs-prose h2) {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.025em;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		scroll-margin-top: 5rem;
	}

	:global(.docs-prose h3) {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		scroll-margin-top: 5rem;
	}

	:global(.docs-prose p) {
		color: var(--color-muted);
		line-height: 1.65;
		margin-bottom: 1rem;
	}

	:global(.docs-prose a:not(.inline-flex)) {
		color: var(--color-foreground);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	:global(.docs-prose a:not(.inline-flex):hover) {
		color: var(--color-primary-400);
	}

	:global(.docs-prose ul) {
		color: var(--color-muted);
		list-style: disc;
		padding-left: 1.25rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	:global(.docs-prose ol) {
		color: var(--color-muted);
		list-style: decimal;
		padding-left: 1.25rem;
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	:global(.docs-prose code) {
		font-family: var(--font-marketing-mono, ui-monospace, monospace);
		font-size: 0.875em;
		color: var(--color-foreground);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0;
		padding: 0.1em 0.35em;
	}

	:global(.docs-prose pre) {
		font-family: var(--font-marketing-mono, ui-monospace, monospace);
		font-size: 0.8125rem;
		line-height: 1.55;
		background: #0c0c0e;
		border: 1px solid var(--color-border-strong);
		border-radius: 0;
		padding: 1rem;
		overflow-x: auto;
		margin-bottom: 1.25rem;
		color: var(--color-foreground);
	}

	:global(.docs-prose pre code) {
		background: transparent;
		border: none;
		padding: 0;
		font-size: inherit;
	}

	/* Playground / marketing code chrome — don't apply prose code chrome */
	:global(.docs-prose .code-window) {
		margin-bottom: 1.25rem;
	}

	:global(.docs-prose .code-window pre),
	:global(.docs-prose .code-window code),
	:global(.docs-prose .json-panel),
	:global(.docs-prose .json-panel code) {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		color: inherit;
		font-size: inherit;
		line-height: inherit;
	}

	:global(.docs-prose .json-panel) {
		padding: 1rem;
	}

	:global(.docs-prose table) {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
	}

	:global(.docs-prose th),
	:global(.docs-prose td) {
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}

	:global(.docs-prose th) {
		background: var(--color-surface);
		color: var(--color-foreground);
		font-weight: 600;
	}

	:global(.docs-prose td) {
		color: var(--color-muted);
	}

	:global(.docs-prose strong) {
		color: var(--color-foreground);
		font-weight: 600;
	}
</style>
