<script lang="ts">
	import '../lib/icons.js';
	import './app.css';

	import type { Snippet } from 'svelte';

	import type { AppUser } from '#lib/auth/user.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { page } from '$app/state';

	import { logout } from './auth.remote.js';
	import { openBillingPortal } from './billing.remote.js';

	let {
		children,
		data
	}: { children: Snippet; data: { user: AppUser | null; hasPaidSubscription: boolean } } = $props();

	const isAuthShell = $derived(
		page.url.pathname === '/login' || page.url.pathname.startsWith('/verify')
	);

	let portalPending = $state(false);

	async function handlePortal() {
		portalPending = true;
		try {
			await openBillingPortal();
		} catch {
			// redirect throws
		} finally {
			portalPending = false;
		}
	}
</script>

<svelte:head>
	<title>SubREST</title>
	<meta
		name="description"
		content="Subtitle aggregator API for developers — multi-provider search and VTT/SRT downloads."
	/>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="apple-touch-icon" href="/logo.png" />
</svelte:head>

<div
	class="bg-background text-foreground"
	class:min-h-dvh={!isAuthShell}
	class:h-dvh={isAuthShell}
	class:overflow-hidden={isAuthShell}
>
	{#if !isAuthShell}
		<header class="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur-md">
			<nav class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
				<a href="/" class="flex items-center gap-2 font-semibold tracking-tight">
					<img src="/logo.svg" alt="" width="20" height="20" class="size-5 rounded-[0.3rem]" />
					SubREST
				</a>
				<div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-muted">
					<a class="hover:text-foreground" href="/#about">About</a>
					<a class="hover:text-foreground" href="/#pricing">Pricing</a>
					<a class="hover:text-foreground" href="/docs">Docs</a>
					{#if data.user}
						<span class="hidden text-muted sm:inline">{data.user.email}</span>
						{#if data.hasPaidSubscription}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								loading={portalPending}
								onclick={handlePortal}
							>
								{#if !portalPending}
									<Icon icon="lucide:credit-card" class="size-3.5 shrink-0" />
								{/if}
								Billing
							</Button>
						{/if}
						<form {...logout}>
							<Button type="submit" variant="ghost" size="sm" loading={logout.pending > 0}>
								{#if !logout.pending}
									<Icon icon="lucide:log-out" class="size-3.5 shrink-0" />
								{/if}
								Log out
							</Button>
						</form>
					{:else}
						<Button href="/login" size="sm">
							<Icon icon="lucide:log-in" class="size-3.5 shrink-0" />
							Login
						</Button>
					{/if}
				</div>
			</nav>
		</header>
	{/if}
	<main class:h-full={isAuthShell}>
		{@render children()}
	</main>
</div>
