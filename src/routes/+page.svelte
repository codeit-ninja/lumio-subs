<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import type { SubtitleDto } from '#lib/subtitles/dto.js';

	import { listSources, searchSubtitles } from './subs.remote.js';

	const sources = await listSources();

	let imdb = $state('');
	let tmdb = $state('');
	let season = $state('');
	let episode = $state('');
	let lang = $state('en');
	let selectedSources = $state<string[]>(['all']);
	let refresh = $state(false);
	let mediaType = $state<'movie' | 'tv'>('movie');
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);
	let results = $state<SubtitleDto[]>([]);

	async function onSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		errorMsg = null;
		try {
			const payload = {
				imdb: imdb.trim() || undefined,
				tmdb: tmdb.trim() ? Number(tmdb.trim()) : undefined,
				s: season.trim() ? Number(season.trim()) : undefined,
				e: episode.trim() ? Number(episode.trim()) : undefined,
				lang: lang.trim() || 'en',
				sources: selectedSources.includes('all') ? 'all' : selectedSources.join(','),
				refresh,
				type: mediaType
			};
			results = await searchSubtitles(payload);
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Search failed';
			results = [];
		} finally {
			loading = false;
		}
	}

	function toggleSource(id: string) {
		if (id === 'all') {
			selectedSources = ['all'];
			return;
		}
		const next = selectedSources.filter((s) => s !== 'all');
		if (next.includes(id)) {
			selectedSources = next.filter((s) => s !== id);
		} else {
			selectedSources = [...next, id];
		}
		if (selectedSources.length === 0) selectedSources = ['all'];
	}
</script>

<section class="space-y-8">
	<div class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">Subtitle search</h1>
		<p class="max-w-2xl text-muted">
			Aggregate and cache subtitles from multiple providers. Prefer IMDb IDs when possible.
		</p>
	</div>

	<form class="space-y-4 rounded-card border border-border bg-surface p-4" onsubmit={onSubmit}>
		<div class="flex flex-wrap gap-2">
			<Button
				type="button"
				size="sm"
				variant={mediaType === 'movie' ? 'primary' : 'secondary'}
				onclick={() => (mediaType = 'movie')}
			>
				Movie
			</Button>
			<Button
				type="button"
				size="sm"
				variant={mediaType === 'tv' ? 'primary' : 'secondary'}
				onclick={() => (mediaType = 'tv')}
			>
				TV
			</Button>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="space-y-1 text-sm">
				<span class="text-muted">IMDb ID</span>
				<Input bind:value={imdb} placeholder="tt3659388" autocomplete="off" />
			</label>
			<label class="space-y-1 text-sm">
				<span class="text-muted">TMDB ID</span>
				<Input bind:value={tmdb} placeholder="286217" inputmode="numeric" />
			</label>
			{#if mediaType === 'tv'}
				<label class="space-y-1 text-sm">
					<span class="text-muted">Season</span>
					<Input bind:value={season} placeholder="1" inputmode="numeric" />
				</label>
				<label class="space-y-1 text-sm">
					<span class="text-muted">Episode</span>
					<Input bind:value={episode} placeholder="1" inputmode="numeric" />
				</label>
			{/if}
			<label class="space-y-1 text-sm">
				<span class="text-muted">Language</span>
				<Input bind:value={lang} placeholder="en" />
			</label>
		</div>

		<div class="space-y-2">
			<p class="text-sm text-muted">Sources</p>
			<div class="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant={selectedSources.includes('all') ? 'primary' : 'secondary'}
					onclick={() => toggleSource('all')}
				>
					All
				</Button>
				{#each sources as source (source.id)}
					<Button
						type="button"
						size="sm"
						variant={selectedSources.includes(source.id) ? 'primary' : 'secondary'}
						onclick={() => toggleSource(source.id)}
					>
						{source.name}
					</Button>
				{/each}
			</div>
		</div>

		<label class="flex items-center gap-2 text-sm text-muted">
			<input type="checkbox" bind:checked={refresh} class="size-4 rounded border-border" />
			Bypass cache (refresh)
		</label>

		<div class="flex items-center gap-3">
			<Button type="submit" disabled={loading}>
				{#if loading}
					<Icon icon="lucide:loader-circle" class="size-4 animate-spin" />
					Searching…
				{:else}
					<Icon icon="lucide:search" class="size-4" />
					Search
				{/if}
			</Button>
			{#if errorMsg}
				<p class="text-sm text-favorite">{errorMsg}</p>
			{/if}
		</div>
	</form>

	{#if results.length}
		<ul class="divide-y divide-border overflow-hidden rounded-card border border-border">
			{#each results as row (row.id)}
				<li class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
					<div class="min-w-0 space-y-1">
						<p class="truncate font-medium">
							{row.release || row.fileName || row.id}
						</p>
						<p class="text-xs text-muted">
							{row.provider} · {row.language} · {row.format}
							{#if row.hearingImpaired}
								· HI
							{/if}
							{#if row.downloadCount != null}
								· {row.downloadCount} downloads
							{/if}
						</p>
					</div>
					<a
						class="inline-flex items-center gap-1 text-sm text-primary-300 hover:underline"
						href="{row.downloadUrl}?format=vtt"
						target="_blank"
						rel="noreferrer"
					>
						<Icon icon="lucide:download" class="size-4" />
						VTT
					</a>
				</li>
			{/each}
		</ul>
	{:else if !loading}
		<p class="text-sm text-muted">No results yet. Run a search to populate the cache.</p>
	{/if}
</section>
