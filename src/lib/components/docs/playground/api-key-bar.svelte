<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { Input } from '#lib/components/ui/input/index.js';

	import { useDocsPlayground } from './context.svelte.js';

	const playground = useDocsPlayground();

	let draft = $derived(playground.apiKey);
	let visible = $state(false);

	function syncDraft(value: string) {
		draft = value;
		playground.setApiKey(value);
	}

	function clear() {
		playground.clearApiKey();
		draft = '';
	}
</script>

<div
	class="sticky top-[3.25rem] z-20 border border-border bg-surface px-3 py-2.5 sm:px-4"
	role="region"
	aria-label="API key"
>
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
		<label class="flex min-w-0 flex-1 items-center gap-2" for="docs-playground-api-key">
			<span class="hidden shrink-0 text-muted sm:inline">
				<Icon icon="lucide:key" class="size-4" />
			</span>
			<span class="sr-only">API key</span>
			<Input
				id="docs-playground-api-key"
				type={visible ? 'text' : 'password'}
				autocomplete="off"
				spellcheck={false}
				placeholder="X-API-Key"
				class="h-8 py-1 font-mono text-sm"
				bind:value={draft}
				oninput={(e) => syncDraft(e.currentTarget.value)}
			/>
		</label>

		<div class="flex shrink-0 items-center gap-1.5">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={() => (visible = !visible)}
				aria-label={visible ? 'Hide API key' : 'Show API key'}
				aria-pressed={visible}
			>
				<Icon icon={visible ? 'lucide:eye-off' : 'lucide:eye'} class="size-4 shrink-0" />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={clear}
				disabled={!draft.trim()}
				aria-label="Clear API key"
			>
				<Icon icon="lucide:x" class="size-4 shrink-0" />
			</Button>
		</div>
	</div>
	<p class="mt-1.5 text-xs text-muted">
		Stored in this tab only (sessionStorage). Pass as <code class="font-mono">X-API-Key</code>.
		<a
			href="/docs/authentication"
			class="text-foreground underline underline-offset-2 hover:text-primary-400"
			>See authentication</a
		>.
	</p>
</div>
