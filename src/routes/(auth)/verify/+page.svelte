<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { page } from '$app/state';

	import { confirmVerification } from '../../auth.remote.js';

	const token = $derived(page.url.searchParams.get('token') ?? '');

	const autoSubmit: Attachment = (element) => {
		const form = element as HTMLFormElement;
		queueMicrotask(() => form.requestSubmit());
	};
</script>

<div class="flex h-dvh items-center justify-center overflow-y-auto px-4 py-12">
	<div class="w-full max-w-md space-y-6 text-center">
		<a href="/" class="inline-flex items-center justify-center gap-2 font-semibold tracking-tight">
			<img src="/logo.svg" alt="" width="20" height="20" class="size-5 rounded-[0.3rem]" />
			SubREST
		</a>

		{#if !token}
			<div class="space-y-3 rounded-button border border-border bg-surface p-6">
				<Icon icon="lucide:link-2-off" class="mx-auto size-8 text-muted" />
				<h1 class="text-xl font-semibold">Missing verification link</h1>
				<p class="text-sm text-muted">
					Open the link from your verification email, or request a new one after signing in.
				</p>
				<Button href="/login" size="sm">Go to login</Button>
			</div>
		{:else if confirmVerification.result?.ok}
			<div class="space-y-3 rounded-button border border-border bg-surface p-6" role="status">
				<Icon icon="lucide:badge-check" class="mx-auto size-8 text-primary" />
				<h1 class="text-xl font-semibold">Email verified</h1>
				<p class="text-sm text-muted">Your account is ready. You can sign in now.</p>
				<Button href="/login" size="sm">
					<Icon icon="lucide:log-in" class="size-4 shrink-0" />
					Continue to login
				</Button>
			</div>
		{:else}
			<form
				{...confirmVerification}
				class="space-y-4 rounded-button border border-border bg-surface p-6"
				{@attach autoSubmit}
			>
				<input {...confirmVerification.fields.token.as('hidden', token)} />

				{#if confirmVerification.fields.allIssues()?.length}
					<Icon icon="lucide:circle-alert" class="mx-auto size-8 text-favorite" />
					<h1 class="text-xl font-semibold">Verification failed</h1>
					{#each confirmVerification.fields.allIssues() ?? [] as issue (issue.message)}
						<p class="text-sm text-favorite">{issue.message}</p>
					{/each}
					{#each confirmVerification.fields.token.issues() ?? [] as issue (issue.message)}
						<p class="text-sm text-favorite">{issue.message}</p>
					{/each}
					<div class="flex flex-wrap items-center justify-center gap-2 pt-2">
						<Button
							type="submit"
							variant="secondary"
							size="sm"
							loading={confirmVerification.pending > 0}
						>
							Try again
						</Button>
						<Button href="/login" size="sm" variant="ghost">Go to login</Button>
					</div>
				{:else}
					<Icon icon="lucide:loader-circle" class="mx-auto size-8 animate-spin text-primary" />
					<h1 class="text-xl font-semibold">Verifying email…</h1>
					<p class="text-sm text-muted">Please wait while we confirm your address.</p>
					<noscript>
						<Button type="submit" class="mt-2" size="sm">Verify email</Button>
					</noscript>
				{/if}
			</form>
		{/if}
	</div>
</div>
