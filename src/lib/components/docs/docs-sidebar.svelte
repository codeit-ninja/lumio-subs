<script lang="ts">
	import { docsNav, isDocsNavActive } from '#lib/docs/nav.js';
	import { page } from '$app/state';

	const pathname = $derived(page.url.pathname);
</script>

<nav class="space-y-6" aria-label="Documentation">
	{#each docsNav as section (section.title)}
		<div>
			<p class="mb-2 px-2 font-mono text-[0.65rem] tracking-wider text-muted uppercase">
				{section.title}
			</p>
			<ul class="space-y-0.5">
				{#each section.items as item (item.href)}
					{@const active = isDocsNavActive(pathname, item.href)}
					<li>
						<a
							href={item.href}
							class={[
								'block rounded-md px-2.5 py-1.5 text-sm transition-colors',
								active
									? 'bg-surface font-medium text-foreground'
									: 'text-muted hover:bg-surface/60 hover:text-foreground'
							]}
							aria-current={active ? 'page' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</nav>
