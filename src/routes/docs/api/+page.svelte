<svelte:head>
	<title>API · SubREST</title>
	<meta
		name="description"
		content="SubREST JSON API — search, subtitles, sources, and status endpoints."
	/>
</svelte:head>

<h1>API overview</h1>
<p>All <code>/api/*</code> errors return JSON:</p>
<pre><code
		>&#123;
  "error": &#123; "code": "SEARCH_INVALID", "message": "…" &#125;
&#125;</code
	></pre>

<nav class="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="On this page">
	<a class="hover:text-foreground" href="#search">Search</a>
	<a class="hover:text-foreground" href="#subtitles">Subtitles</a>
	<a class="hover:text-foreground" href="#sources">Sources</a>
	<a class="hover:text-foreground" href="#status">Status</a>
</nav>

<h2 id="search"><code>GET /api/search</code></h2>
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
			<td><code>sources</code></td>
			<td>Comma list or <code>all</code></td>
		</tr>
		<tr>
			<td><code>refresh</code></td>
			<td><code>true</code> to re-scrape and replace stored results</td>
		</tr>
		<tr>
			<td><code>type</code></td>
			<td><code>movie</code> | <code>tv</code></td>
		</tr>
	</tbody>
</table>

<p>Response:</p>
<pre><code
		>&#123;
  "results": [
    &#123;
      "id": "…",
      "language": "en",
      "format": "vtt",
      "release": "…",
      "fileName": "…",
      "downloadUrl": "https://…r2.cloudflarestorage.com/bucket/…/….vtt"
    &#125;
  ]
&#125;</code
	></pre>

<p>
	<code>downloadUrl</code> is a direct R2 object URL once the subtitle file is stored. Until then it
	is <code>/api/subtitles/:id</code>.
</p>
<p>
	Search returns stored rows when present. On a miss (or <code>refresh=true</code>), providers are
	scraped, files are downloaded and stored permanently, then results are returned.
</p>

<h2 id="subtitles"><code>GET /api/subtitles/:id</code></h2>
<p>
	Query: <code>format=vtt|srt</code>. Serves a stored subtitle: <strong>302</strong> to the R2 URL
	for <code>format=vtt</code> (default). <code>format=srt</code> streams a converted body from the stored
	VTT. If a row is missing its file, the provider is used once as a fallback warm path.
</p>

<h2 id="sources"><code>GET /api/sources</code></h2>
<p>Enabled providers and capabilities.</p>

<h2 id="status"><code>GET /api/status</code></h2>
<p>In-memory provider health (latency / last error).</p>
