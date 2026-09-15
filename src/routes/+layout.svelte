<script lang="ts">
	import '../lib/icons.js';
	import './app.css';

	import type { Snippet } from 'svelte';

	import type { AppUser } from '#lib/auth/user.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import type { DropdownMenuItem } from '#lib/components/ui/dropdown-menu/index.js';
	import { DropdownMenu } from '#lib/components/ui/dropdown-menu/index.js';
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

	const accountMenuItems = $derived.by((): DropdownMenuItem[] => [
		{
			id: 'dashboard',
			label: 'Dashboard',
			href: '/dashboard',
			icon: 'lucide:layout-dashboard'
		},
		{
			id: 'logout',
			label: 'Log out',
			icon: 'lucide:log-out',
			form: { ...logout },
			disabled: logout.pending > 0,
			loading: logout.pending > 0
		}
	]);

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
						<DropdownMenu
							header={data.user.email}
							items={accountMenuItems}
							aria-label="Account"
							triggerClass="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-elevated hover:text-foreground"
						>
							{#snippet trigger()}
								<Icon icon="lucide:user" class="size-4 shrink-0" />
							{/snippet}
						</DropdownMenu>
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
