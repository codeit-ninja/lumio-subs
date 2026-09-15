<svelte:head>
	<title>Documentation · SubREST</title>
	<meta
		name="description"
		content="SubREST documentation — subtitle aggregator API for developers."
	/>
</svelte:head>

<h1>Introduction</h1>
<p>
	SubREST is a subtitle aggregator API for developers. Search across multiple providers, store
	results permanently, and download VTT or SRT through a clean JSON contract.
</p>
<p>
	It is not Wyzie-compatible — SubREST has its own API. Use it as a self-hosted replacement for
	unreliable third-party subtitle proxies, or as a backend for media apps and streaming clients.
</p>

<h2>What you get</h2>
<ul>
	<li>Multi-provider search with normalized results</li>
	<li>Permanent storage in PocketBase + R2</li>
	<li>Direct download URLs once files are stored</li>
	<li>Health and source discovery endpoints</li>
</ul>
