<script lang="ts">
	import type { Plan as BillingPlan } from '#lib/billing/plan.js';
	import * as Plan from '#lib/components/billing/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { page } from '$app/state';

	import { openBillingPortal, startCheckout } from './billing.remote.js';

	let {
		data
	}: {
		data: {
			plans: BillingPlan[];
			activePlanId: string | null;
			hasPaidSubscription: boolean;
			stripeConfigured: boolean;
		};
	} = $props();

	let checkoutPlanId = $state<string | null>(null);
	let portalPending = $state(false);
	let billingError = $state<string | null>(null);

	const user = $derived(page.data.user as { id: string; email: string } | null);

	const searchResponse = `{
  "results": [
    {
      "id": "os:en:tt0111161:0",
      "language": "en",
      "format": "vtt",
      "release": "Shawshank.Redemption.1994.1080p",
      "fileName": "The.Shawshank.Redemption.en.vtt",
      "downloadUrl": "https://…/subtitles/….vtt"
    }
  ]
}`;

	type JsonTokenKind = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'text';

	type JsonToken = {
		kind: JsonTokenKind;
		value: string;
	};

	function tokenizeJson(source: string): JsonToken[] {
		const tokens: JsonToken[] = [];
		const pattern =
			/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}]|\[|\]|,/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = pattern.exec(source)) !== null) {
			if (match.index > lastIndex) {
				tokens.push({ kind: 'text', value: source.slice(lastIndex, match.index) });
			}

			const [full, stringLiteral, colon, literal] = match;

			if (stringLiteral !== undefined) {
				tokens.push({ kind: colon !== undefined ? 'key' : 'string', value: stringLiteral });
				if (colon !== undefined) {
					tokens.push({ kind: 'punct', value: colon });
				}
			} else if (literal === 'true' || literal === 'false') {
				tokens.push({ kind: 'boolean', value: literal });
			} else if (literal === 'null') {
				tokens.push({ kind: 'null', value: literal });
			} else if (full === '{' || full === '}' || full === '[' || full === ']' || full === ',') {
				tokens.push({ kind: 'punct', value: full });
			} else {
				tokens.push({ kind: 'number', value: full });
			}

			lastIndex = match.index + full.length;
		}

		if (lastIndex < source.length) {
			tokens.push({ kind: 'text', value: source.slice(lastIndex) });
		}

		return tokens;
	}

	const responseTokens = tokenizeJson(searchResponse);

	const jsonTokenClass: Record<Exclude<JsonTokenKind, 'text'>, string> = {
		key: 'json-key',
		string: 'json-string',
		number: 'json-number',
		boolean: 'json-boolean',
		null: 'json-null',
		punct: 'json-punct'
	};

	async function handleCheckout(planId: string) {
		billingError = null;
		checkoutPlanId = planId;
		try {
			const result = await startCheckout({ planId });
			if (result && typeof result === 'object' && 'ok' in result && result.ok === false) {
				billingError = result.message;
			}
		} catch {
			// redirect throws
		} finally {
			checkoutPlanId = null;
		}
	}

	async function handlePortal() {
		billingError = null;
		portalPending = true;
		try {
			const result = await openBillingPortal();
			if (result && typeof result === 'object' && 'ok' in result && result.ok === false) {
				billingError = result.message;
			}
		} catch {
			// redirect
		} finally {
			portalPending = false;
		}
	}
</script>

<div class="marketing-home">
	<section class="hero relative overflow-hidden border-b border-border">
		<div class="hero-bg pointer-events-none absolute inset-0" aria-hidden="true">
			<div class="hero-glow hero-glow-a"></div>
			<div class="hero-glow hero-glow-b"></div>
			<div class="hero-glow hero-glow-c"></div>
			<div class="hero-grid"></div>
			<div class="hero-grid hero-grid-fine"></div>
			<div class="hero-dots"></div>
			<div class="hero-sweep"></div>
		</div>

		<div
			class="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:py-24"
		>
			<div class="hero-copy flex flex-col gap-8">
				<div class="flex flex-col gap-5">
					<p class="brand flex items-center gap-3 tracking-tight">
						<img
							src="/logo.svg"
							alt=""
							width="40"
							height="40"
							class="size-10 shrink-0 rounded-[0.4rem]"
						/>
						<span class="text-4xl font-semibold sm:text-5xl lg:text-6xl">SubREST</span>
					</p>
					<h1
						class="max-w-lg text-2xl font-medium tracking-tight text-balance text-muted sm:text-3xl"
					>
						Subtitle aggregator API for developers
					</h1>
					<p class="max-w-lg text-base leading-relaxed text-pretty text-muted sm:text-lg">
						One JSON API across multiple subtitle providers — search, pick a result, download VTT or
						SRT in your app.
					</p>
				</div>

				<div class="flex flex-wrap gap-3">
					<Button href="/#pricing" size="lg">
						View plans
						<Icon icon="lucide:arrow-down" class="size-4 shrink-0" />
					</Button>
					{#if user}
						<Button href="/docs" variant="secondary" size="lg">
							Docs
							<Icon icon="lucide:book-open" class="size-4 shrink-0" />
						</Button>
					{:else}
						<Button href="/login" variant="secondary" size="lg">
							Get started
							<Icon icon="lucide:log-in" class="size-4 shrink-0" />
						</Button>
					{/if}
				</div>
			</div>

			<div class="hero-terminal min-w-0" aria-label="Sample API response">
				<div
					class="overflow-hidden rounded-md border border-border-strong bg-[#0c0c0e] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
				>
					<div
						class="flex items-center gap-2 border-b border-border px-4 py-2.5 font-mono text-[0.7rem]"
					>
						<span class="size-2 rounded-full bg-border-strong" aria-hidden="true"></span>
						<span class="size-2 rounded-full bg-border-strong" aria-hidden="true"></span>
						<span class="size-2 rounded-full bg-border-strong" aria-hidden="true"></span>
						<span class="ml-2 truncate text-muted">
							<span class="json-method">GET</span>
							<span class="text-gray-400"> /api/search?imdb=tt0111161&amp;lang=en</span>
							<span class="caret" aria-hidden="true"></span>
						</span>
					</div>
					<pre
						class="json-panel max-h-[min(28rem,55vh)] overflow-auto p-4 text-[0.7rem] leading-relaxed sm:text-xs sm:leading-relaxed"><code
							>
							{#each responseTokens as token, i (i)}{#if token.kind === 'text'}{token.value}{:else}<span
										class={jsonTokenClass[token.kind]}>{token.value}</span
									>
									{/if}
									{/each}
									</code
						></pre>
				</div>
			</div>
		</div>
	</section>

	<section class="benefits relative px-4 py-16 sm:py-20">
		<div class="cf-frame cf-frame-dashed mx-auto max-w-6xl">
			<span class="cf-mark cf-mark-tl" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-tr" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-bl" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-br" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-t33 hidden sm:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-t66 hidden sm:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-b33 hidden sm:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-b66 hidden sm:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-ml hidden sm:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-mr hidden sm:block" aria-hidden="true"></span>

			<div class="grid sm:grid-cols-3">
				<div
					class="flex flex-col gap-3 border-b border-border p-6 sm:border-r sm:border-b-0 sm:p-8"
				>
					<p class="font-mono text-[0.65rem] tracking-wider text-muted uppercase">01</p>
					<h2 class="text-base font-semibold tracking-tight">Multi-provider search</h2>
					<p class="text-sm leading-relaxed text-pretty text-muted">
						Query IMDb or TMDB once and search across every enabled subtitle source in parallel.
					</p>
				</div>
				<div
					class="flex flex-col gap-3 border-b border-border p-6 sm:border-r sm:border-b-0 sm:p-8"
				>
					<p class="font-mono text-[0.65rem] tracking-wider text-muted uppercase">02</p>
					<h2 class="text-base font-semibold tracking-tight">Normalized JSON</h2>
					<p class="text-sm leading-relaxed text-pretty text-muted">
						One consistent response shape — language, release, provider, and download URL — every
						time.
					</p>
				</div>
				<div class="flex flex-col gap-3 p-6 sm:p-8">
					<p class="font-mono text-[0.65rem] tracking-wider text-muted uppercase">03</p>
					<h2 class="text-base font-semibold tracking-tight">VTT &amp; SRT downloads</h2>
					<p class="text-sm leading-relaxed text-pretty text-muted">
						Authenticate once, then pull subtitle files your media app or backend can use
						immediately.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section id="about" class="about scroll-mt-20 border-y border-border">
		<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
			<div
				class="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16"
			>
				<div class="flex flex-col gap-6">
					<p class="font-mono text-xs tracking-wider text-primary uppercase">How it works</p>
					<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
						Built for developers
					</h2>
					<p class="max-w-xl text-lg leading-relaxed text-pretty text-muted">
						SubREST aggregates subtitles from multiple providers, normalizes the results, and serves
						VTT or SRT through a clean JSON API. Drop it into media apps, streaming clients, or any
						backend that needs reliable subtitle lookup — without stitching providers yourself.
					</p>

					<ul class="mt-2 flex flex-col gap-5 border-l border-border pl-5">
						<li class="flex flex-col gap-1">
							<span class="font-mono text-xs text-primary">01 · search</span>
							<span class="text-sm text-muted"
								>Query by IMDb or TMDB across every enabled provider.</span
							>
						</li>
						<li class="flex flex-col gap-1">
							<span class="font-mono text-xs text-primary">02 · pick</span>
							<span class="text-sm text-muted"
								>Normalized JSON with language, release, and download URL.</span
							>
						</li>
						<li class="flex flex-col gap-1">
							<span class="font-mono text-xs text-primary">03 · download</span>
							<span class="text-sm text-muted"
								>Fetch VTT or SRT with a single authenticated call.</span
							>
						</li>
					</ul>
				</div>

				<div class="min-w-0">
					<div class="cf-frame">
						<span class="cf-mark cf-mark-tl" aria-hidden="true"></span>
						<span class="cf-mark cf-mark-tr" aria-hidden="true"></span>
						<span class="cf-mark cf-mark-bl" aria-hidden="true"></span>
						<span class="cf-mark cf-mark-br" aria-hidden="true"></span>

						<div class="bg-[#0c0c0e]">
							<div
								class="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 font-mono text-[0.7rem] text-muted"
							>
								<span>request.headers</span>
								<span class="text-gray-600">HTTP</span>
							</div>
							<div
								class="auth-panel overflow-x-auto px-4 py-4 font-mono text-[0.75rem] leading-relaxed sm:text-xs"
							>
								<span class="json-key">Authorization</span><span class="json-punct">:</span>
								<span class="json-boolean">Bearer</span>
								<span class="json-string">&lt;your_api_key&gt;</span>
							</div>
							<div class="border-t border-border px-4 py-3 font-mono text-[0.7rem] leading-relaxed">
								<p class="text-gray-600"># then call</p>
								<p class="mt-1.5 truncate">
									<span class="json-method">GET</span>
									<span class="text-gray-400"> /api/search?imdb=tt0111161&amp;lang=en</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section id="pricing" class="scroll-mt-20 px-4 py-20 sm:py-24">
		<div class="cf-frame mx-auto max-w-6xl">
			<span class="cf-mark cf-mark-tl" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-tr" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-bl" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-br" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-t1 hidden xl:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-t2 hidden xl:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-t3 hidden xl:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-b1 hidden xl:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-b2 hidden xl:block" aria-hidden="true"></span>
			<span class="cf-mark cf-mark-b3 hidden xl:block" aria-hidden="true"></span>

			<div class="border-b border-border px-6 py-8 sm:px-8">
				<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h2>
				<p class="mt-3 max-w-2xl text-muted">
					Every account starts on Free. Upgrade for higher rate limits when your app grows.
				</p>
				{#if billingError}
					<p class="mt-4 text-sm text-red-400">{billingError}</p>
				{/if}
			</div>

			{#if data.plans.length === 0}
				<p class="px-6 py-10 text-muted sm:px-8">No plans published yet.</p>
			{:else}
				<div class="plan-grid grid sm:grid-cols-2 xl:grid-cols-4">
					{#each data.plans as plan, i (plan.id)}
						<div class="plan-card relative h-full" style="--plan-i: {i}">
							<Plan.Root
								{plan}
								loggedIn={Boolean(user)}
								hasPaidSubscription={data.hasPaidSubscription}
								isCurrentPlan={data.activePlanId === plan.id}
								stripeConfigured={data.stripeConfigured}
								onCheckout={handleCheckout}
								onPortal={handlePortal}
								checkoutPending={checkoutPlanId === plan.id}
								{portalPending}
								class="plan-cell h-full rounded-none border-0 border-r border-b border-border bg-transparent p-6 shadow-none ring-0 sm:p-8 {plan.highlighted
									? 'highlighted bg-surface/50'
									: ''}"
							>
								<div class="flex flex-col gap-1">
									<Plan.Badge />
									<Plan.Name />
									<Plan.Description />
									<Plan.Limits />
								</div>
								<Plan.Price />
								<Plan.Features />
								<div class="mt-auto pt-2">
									<Plan.Action />
								</div>
							</Plan.Root>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.hero-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(72px);
		will-change: transform, opacity;
		pointer-events: none;
	}

	.hero-glow-a {
		top: -28%;
		left: -12%;
		width: min(58vw, 42rem);
		height: min(58vw, 42rem);
		background: radial-gradient(
			circle,
			color-mix(in oklab, var(--color-primary) 42%, transparent) 0%,
			color-mix(in oklab, var(--color-primary-950) 55%, transparent) 45%,
			transparent 70%
		);
		opacity: 0.38;
		animation: glow-drift-a 26s ease-in-out infinite;
	}

	.hero-glow-b {
		top: 8%;
		right: -18%;
		width: min(52vw, 36rem);
		height: min(52vw, 36rem);
		background: radial-gradient(
			circle,
			color-mix(in oklab, var(--color-primary-600) 38%, transparent) 0%,
			color-mix(in oklab, var(--color-primary-950) 40%, transparent) 50%,
			transparent 72%
		);
		opacity: 0.28;
		animation: glow-drift-b 32s ease-in-out infinite;
	}

	.hero-glow-c {
		bottom: -30%;
		left: 28%;
		width: min(48vw, 32rem);
		height: min(48vw, 32rem);
		background: radial-gradient(
			circle,
			color-mix(in oklab, var(--color-primary-950) 70%, transparent) 0%,
			color-mix(in oklab, var(--color-primary) 18%, transparent) 40%,
			transparent 70%
		);
		opacity: 0.32;
		animation: glow-drift-c 28s ease-in-out infinite;
	}

	.hero-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(
				to right,
				color-mix(in oklab, var(--color-border) 70%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				to bottom,
				color-mix(in oklab, var(--color-border) 50%, transparent) 1px,
				transparent 1px
			);
		background-size: 64px 64px;
		mask-image: radial-gradient(ellipse 85% 70% at 50% 20%, black 10%, transparent 75%);
		opacity: 0.55;
		animation: grid-drift 40s linear infinite;
	}

	.hero-grid-fine {
		background-image:
			linear-gradient(
				to right,
				color-mix(in oklab, var(--color-primary) 14%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				to bottom,
				color-mix(in oklab, var(--color-primary) 10%, transparent) 1px,
				transparent 1px
			);
		background-size: 22px 22px;
		mask-image: radial-gradient(ellipse 70% 55% at 45% 30%, black 5%, transparent 70%);
		opacity: 0.35;
		animation: grid-drift-fine 55s linear infinite;
	}

	.hero-dots {
		position: absolute;
		inset: 0;
		opacity: 0.4;
		background-image: radial-gradient(
			circle at 1px 1px,
			color-mix(in oklab, var(--color-primary) 22%, transparent) 1px,
			transparent 0
		);
		background-size: 28px 28px;
		mask-image: radial-gradient(ellipse 80% 65% at 50% 25%, black 15%, transparent 72%);
		animation: dots-drift 50s linear infinite;
	}

	.hero-sweep {
		position: absolute;
		left: 0;
		right: 0;
		top: -8%;
		height: 18%;
		background: linear-gradient(
			to bottom,
			transparent 0%,
			color-mix(in oklab, var(--color-primary) 12%, transparent) 45%,
			transparent 100%
		);
		opacity: 0.22;
		will-change: transform;
		animation: sweep-pass 16s ease-in-out infinite;
	}

	@keyframes glow-drift-a {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
			opacity: 0.34;
		}
		50% {
			transform: translate3d(6%, 8%, 0) scale(1.08);
			opacity: 0.48;
		}
	}

	@keyframes glow-drift-b {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
			opacity: 0.24;
		}
		50% {
			transform: translate3d(-8%, 6%, 0) scale(1.1);
			opacity: 0.36;
		}
	}

	@keyframes glow-drift-c {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
			opacity: 0.28;
		}
		50% {
			transform: translate3d(5%, -10%, 0) scale(1.06);
			opacity: 0.4;
		}
	}

	@keyframes grid-drift {
		from {
			background-position: 0 0;
		}
		to {
			background-position: 64px 64px;
		}
	}

	@keyframes grid-drift-fine {
		from {
			background-position: 0 0;
		}
		to {
			background-position: -22px 22px;
		}
	}

	@keyframes dots-drift {
		from {
			background-position: 0 0;
		}
		to {
			background-position: 28px 28px;
		}
	}

	@keyframes sweep-pass {
		0%,
		12% {
			transform: translate3d(0, 0, 0);
			opacity: 0;
		}
		18% {
			opacity: 0.22;
		}
		55% {
			transform: translate3d(0, 520%, 0);
			opacity: 0.18;
		}
		70%,
		100% {
			transform: translate3d(0, 580%, 0);
			opacity: 0;
		}
	}

	.hero-copy {
		animation: hero-in 0.7s ease-out both;
	}

	.hero-terminal {
		animation: terminal-in 0.85s 0.12s ease-out both;
	}

	.auth-panel {
		color: #a1a1aa;
	}

	.caret {
		display: inline-block;
		width: 0.45em;
		height: 1em;
		margin-left: 0.15em;
		vertical-align: -0.12em;
		background: color-mix(in oklab, var(--color-primary) 80%, white);
		animation: caret-blink 1.1s step-end infinite;
	}

	.json-method {
		color: #34d399;
		font-weight: 500;
	}

	.json-panel {
		color: #71717a;
	}

	.json-key {
		color: #7dd3fc;
	}

	.json-string {
		color: #86efac;
	}

	.json-number {
		color: #fbbf24;
	}

	.json-boolean {
		color: #f9a8d4;
	}

	.json-null {
		color: #a78bfa;
	}

	.json-punct {
		color: #a1a1aa;
	}

	.plan-card {
		animation: plan-in 0.55s ease-out both;
		animation-delay: calc(var(--plan-i, 0) * 70ms);
	}

	.plan-grid :global(.plan-cell.highlighted) {
		box-shadow: inset 0 0 0 1px var(--color-primary);
	}

	@media (min-width: 640px) {
		.plan-grid > :nth-child(2n) :global(.plan-cell) {
			border-right-width: 0;
		}

		.plan-grid > :nth-child(-n + 2) :global(.plan-cell) {
			border-bottom-width: 1px;
		}

		.plan-grid > :nth-child(n + 3) :global(.plan-cell) {
			border-bottom-width: 0;
		}
	}

	@media (min-width: 1280px) {
		.plan-grid > :nth-child(2n) :global(.plan-cell) {
			border-right-width: 1px;
		}

		.plan-grid > :last-child :global(.plan-cell) {
			border-right-width: 0;
		}

		.plan-grid > :nth-child(-n + 2) :global(.plan-cell),
		.plan-grid > :nth-child(n + 3) :global(.plan-cell) {
			border-bottom-width: 0;
		}
	}

	@keyframes hero-in {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes terminal-in {
		from {
			opacity: 0;
			transform: translateY(1rem) scale(0.985);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes plan-in {
		from {
			opacity: 0;
			transform: translateY(0.6rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes caret-blink {
		50% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-glow,
		.hero-grid,
		.hero-dots,
		.hero-sweep,
		.hero-copy,
		.hero-terminal,
		.plan-card,
		.caret {
			animation: none;
		}

		.hero-glow-a {
			opacity: 0.38;
		}

		.hero-glow-b {
			opacity: 0.28;
		}

		.hero-glow-c {
			opacity: 0.32;
		}

		.hero-sweep {
			opacity: 0;
		}
	}
</style>
