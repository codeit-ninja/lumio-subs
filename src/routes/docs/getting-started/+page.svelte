<svelte:head>
	<title>Getting started · SubREST</title>
	<meta name="description" content="Quick start guide for running SubREST locally." />
</svelte:head>

<h1>Getting started</h1>
<p>Run SubREST locally with Docker for PocketBase and provider sidecars, then start the app.</p>

<h2>1. Configure environment</h2>
<pre><code
		>cp .env.example .env
# fill TMDB_API_KEY, PB_ADMIN_*</code
	></pre>

<h2>2. Start dependencies</h2>
<pre><code
		>docker compose up -d   # PocketBase + LavX OpenSubtitles scraper + FlareSolverr
bun install
bun run dev</code
	></pre>

<p>Default local URLs:</p>
<ul>
	<li>App: <code>http://127.0.0.1:5180</code></li>
	<li>PocketBase: <code>http://127.0.0.1:8093</code></li>
	<li>
		OpenSubtitles scraper: <code>http://127.0.0.1:8000</code> (<code>/docs</code> for Swagger)
	</li>
</ul>

<p>
	Create the PocketBase admin on first boot if the container does not auto-create from
	<code>PB_ADMIN_EMAIL</code> / <code>PB_ADMIN_PASSWORD</code>. Schema migrations run from
	<code>pocketbase/pb_migrations/</code>.
</p>

<h2>3. Call the API</h2>
<p>
	Once the app is up, try a search. See the
	<a href="/docs/api">API overview</a> for parameters and response shapes.
</p>

<pre><code>curl "http://127.0.0.1:5180/api/search?imdb=tt0133093&amp;lang=en"</code></pre>
