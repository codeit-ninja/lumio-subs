<script lang="ts">
	import { JsonCode, TryIt } from '#lib/components/docs/index.js';
	import {
		buildSearchUrl,
		SEARCH_EXAMPLE,
		searchDefaults,
		searchFields
	} from '#lib/docs/api-endpoints.js';
</script>

<svelte:head>
	<title>GET /api/search · API · SubREST</title>
	<meta name="description" content="Search aggregated subtitles by IMDb or TMDB id." />
</svelte:head>

<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
	<div class="min-w-0">
		<h1><code>GET /api/search</code></h1>
		<table>
			<thead>
				<tr>
					<th>Param</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>imdb</code></td>
					<td>IMDb id (<code>tt…</code>) — preferred</td>
				</tr>
				<tr>
					<td><code>tmdb</code></td>
					<td>TMDB numeric id</td>
				</tr>
				<tr>
					<td><code>s</code> / <code>e</code></td>
					<td>Season / episode (TV)</td>
				</tr>
				<tr>
					<td><code>lang</code></td>
					<td>ISO language (default <code>en</code>)</td>
				</tr>
				<tr>
					<td><code>type</code></td>
					<td><code>movie</code> | <code>tv</code></td>
				</tr>
			</tbody>
		</table>

		<p>Response:</p>
		<JsonCode source={SEARCH_EXAMPLE} title="Response" />

		<p>
			<code>downloadUrl</code> is a direct R2 object URL once the subtitle file is stored. Until
			then it is <code>/api/subtitles/:id</code>. Results do not expose the upstream provider.
		</p>
		<p>
			Search returns stored rows when a previous scrape is still fresh. On a miss (or when the media
			TTL has expired), all providers are scraped, new unique subtitles are appended permanently,
			and the full set for that key is returned.
		</p>
		<p>Refresh TTL (by media release date):</p>
		<ul>
			<li>Released &lt; 30 days ago: every 1 day</li>
			<li>Released &lt; 1 year ago: every 7 days</li>
			<li>Released &lt; 5 years ago: every 30 days</li>
			<li>Older / unknown release: every 90 days</li>
		</ul>
	</div>
	<TryIt
		method="GET"
		pathTemplate="/api/search"
		description="Search aggregated subtitles"
		fields={searchFields}
		defaults={searchDefaults}
		buildUrl={buildSearchUrl}
	/>
</div>
