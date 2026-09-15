<script lang="ts">
	import '../lib/icons.js';
	import './app.css';

	import { Icon } from '#lib/components/ui/icon/index.js';

	let { children } = $props();
</script>

<svelte:head>
	<title>Lumio Subs</title>
</svelte:head>

<div class="min-h-dvh bg-background text-foreground">
	<header class="sticky top-0 z-20 border-b border-border bg-background px-4 py-3">
		<nav class="mx-auto flex max-w-5xl items-center justify-between gap-4">
			<a href="/" class="flex items-center gap-2 font-semibold tracking-tight">
				<Icon icon="lucide:captions" class="size-5 text-primary" />
				Lumio Subs
			</a>
			<div class="flex items-center gap-3 text-sm text-muted">
				<a class="hover:text-foreground" href="/">Search</a>
				<a class="hover:text-foreground" href="/status">Status</a>
				<a class="hover:text-foreground" href="/api/sources">API</a>
			</div>
		</nav>
	</header>
	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
