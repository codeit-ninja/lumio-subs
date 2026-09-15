<script lang="ts">
	import { untrack } from 'svelte';

	import { CodeWindow } from '#lib/components/marketing/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { Input, inputVariants } from '#lib/components/ui/input/index.js';

	import { maskApiKey, useDocsPlayground } from './context.svelte.js';
	import JsonCode from './json-code.svelte';
	import type { ParamField } from './types.js';

	type ResponseKind = 'json' | 'text' | 'redirect' | 'empty' | 'error';

	type Props = {
		method: string;
		pathTemplate: string;
		description?: string;
		fields: ParamField[];
		/** Initial field values keyed by name */
		defaults?: Record<string, string>;
		/** How to build the request URL from field values. Receives values map, returns path+query */
		buildUrl: (values: Record<string, string>) => string;
		/** If true, fetch with redirect: 'manual' (for subtitle endpoint) */
		manualRedirect?: boolean;
		class?: string;
	};

	const BODY_PREVIEW_LIMIT = 50_000;

	let {
		method,
		pathTemplate,
		description = '',
		fields,
		defaults = {},
		buildUrl,
		manualRedirect = false,
		class: className = ''
	}: Props = $props();

	const playground = useDocsPlayground();

	function initValues(
		fieldList: ParamField[],
		initial: Record<string, string>
	): Record<string, string> {
		const next: Record<string, string> = {};
		for (const field of fieldList) {
			next[field.name] = initial[field.name] ?? '';
		}
		return next;
	}

	// Snapshot initial defaults once; user edits are local thereafter.
	let values = $state(untrack(() => initValues(fields, defaults)));
	let loading = $state(false);
	let status = $state<number | null>(null);
	let statusText = $state('');
	let durationMs = $state<number | null>(null);
	let responseBody = $state('');
	let responseKind = $state<ResponseKind | null>(null);
	let locationHeader = $state('');
	let hasSent = $state(false);

	const requestUrl = $derived(buildUrl(values));
	const authLine = $derived(
		playground.apiKey.trim() ? `X-API-Key: ${maskApiKey(playground.apiKey)}` : '(session cookie)'
	);
	const statusOk = $derived(status != null && status >= 200 && status < 300);
	const statusRedirect = $derived(
		responseKind === 'redirect' || (status != null && status >= 300 && status < 400)
	);
	const selectClass = inputVariants({ class: 'h-8 py-1 text-sm' });

	function truncate(text: string): string {
		if (text.length <= BODY_PREVIEW_LIMIT) return text;
		return `${text.slice(0, BODY_PREVIEW_LIMIT)}\n… (truncated)`;
	}

	async function send() {
		loading = true;
		hasSent = true;
		status = null;
		statusText = '';
		durationMs = null;
		responseBody = '';
		responseKind = null;
		locationHeader = '';

		const started = performance.now();

		try {
			const response = await fetch(requestUrl, {
				headers: playground.authHeaders,
				redirect: manualRedirect ? 'manual' : 'follow'
			});

			durationMs = Math.round(performance.now() - started);
			status = response.status;
			statusText = response.statusText;

			const isRedirect =
				response.type === 'opaqueredirect' ||
				status === 301 ||
				status === 302 ||
				status === 303 ||
				status === 307 ||
				status === 308;

			if (isRedirect) {
				responseKind = 'redirect';
				locationHeader = response.headers.get('Location') ?? response.headers.get('location') ?? '';
				return;
			}

			const text = await response.text();
			if (!text) {
				responseKind = 'empty';
				return;
			}

			try {
				const pretty = JSON.stringify(JSON.parse(text), null, 2);
				responseBody = truncate(pretty);
				responseKind = 'json';
			} catch {
				responseBody = truncate(text);
				responseKind = 'text';
			}
		} catch (error) {
			durationMs = Math.round(performance.now() - started);
			status = 0;
			statusText = 'Error';
			responseKind = 'error';
			responseBody = error instanceof Error ? error.message : 'Request failed';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="space-y-4 rounded-md border border-border bg-surface p-4 lg:sticky lg:top-[9rem] {className}"
>
	<div class="space-y-1">
		<div class="flex flex-wrap items-baseline gap-2 font-mono text-sm">
			<span class="font-medium text-emerald-400">{method}</span>
			<span class="break-all text-foreground">{pathTemplate}</span>
		</div>
		{#if description}
			<p class="text-sm text-muted">{description}</p>
		{/if}
	</div>

	{#if fields.length > 0}
		<div class="space-y-3">
			{#each fields as field (field.name)}
				<label class="block space-y-1" for={`try-it-${field.name}`}>
					<span class="text-xs text-muted">
						{field.label ?? field.name}
						{#if field.required}<span class="text-foreground">*</span>{/if}
					</span>
					{#if field.kind === 'select'}
						<select
							id={`try-it-${field.name}`}
							class={selectClass}
							bind:value={values[field.name]}
							required={field.required}
						>
							{#each field.options ?? [] as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					{:else}
						<Input
							id={`try-it-${field.name}`}
							type="text"
							class="h-8 py-1 font-mono text-sm"
							placeholder={field.placeholder}
							required={field.required}
							bind:value={values[field.name]}
						/>
					{/if}
				</label>
			{/each}
		</div>
	{/if}

	<CodeWindow variant="embedded" class="overflow-hidden rounded-md border border-border">
		{#snippet title()}Request{/snippet}
		{#snippet titleTrailing()}preview{/snippet}
		<pre
			class="overflow-x-auto p-3 font-mono text-[0.7rem] leading-relaxed text-muted sm:text-xs"><code
				><span class="text-emerald-400">{method}</span> {requestUrl}
{authLine}</code
			></pre>
	</CodeWindow>

	<Button type="button" variant="primary" size="sm" {loading} onclick={send}>
		<Icon icon="lucide:play" class="size-3.5 shrink-0" />
		Send
	</Button>

	{#if hasSent}
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-2 text-xs">
				{#if status != null}
					<span
						class={[
							'inline-flex items-center border px-2 py-0.5 font-mono',
							statusOk
								? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
								: statusRedirect
									? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
									: 'border-red-500/40 bg-red-500/10 text-red-400'
						]}
					>
						{status}
						{#if statusText}
							{statusText}
						{/if}
					</span>
				{/if}
				{#if durationMs != null}
					<span class="text-muted">{durationMs} ms</span>
				{/if}
			</div>

			{#if responseKind === 'redirect'}
				<CodeWindow variant="embedded" class="overflow-hidden rounded-md border border-border">
					{#snippet title()}Redirect{/snippet}
					{#snippet titleTrailing()}Location{/snippet}
					<pre
						class="overflow-x-auto p-3 font-mono text-[0.7rem] leading-relaxed text-muted sm:text-xs"><code
							>{locationHeader || '(no Location header — opaqueredirect)'}</code
						></pre>
				</CodeWindow>
			{:else if responseKind === 'json'}
				<JsonCode source={responseBody} title="Response" />
			{:else if responseKind === 'text' || responseKind === 'error'}
				<CodeWindow variant="embedded" class="overflow-hidden rounded-md border border-border">
					{#snippet title()}Response{/snippet}
					{#snippet titleTrailing()}{responseKind === 'error' ? 'error' : 'text'}{/snippet}
					<pre
						class="max-h-[min(28rem,55vh)] overflow-auto p-3 font-mono text-[0.7rem] leading-relaxed text-muted sm:text-xs"><code
							>{responseBody}</code
						></pre>
				</CodeWindow>
			{:else if responseKind === 'empty'}
				<p class="text-sm text-muted">Empty response body.</p>
			{/if}
		</div>
	{/if}
</div>
