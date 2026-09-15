<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';

	import CodeWindow from './code-window.svelte';
	import JsonHighlight from './json-highlight.svelte';

	let {
		loggedIn
	}: {
		loggedIn: boolean;
	} = $props();

	const searchResponse = `{
  "results": [
    {
      "id": "os:en:tt0111161:0",
      "language": "en",
      "format": "vtt",
      "release": "Shawshank.Redemption.1994.1080p",
      "downloadUrl": "https://…/subtitles/….vtt"
    }
  ]
}`;
</script>

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
				{#if loggedIn}
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
			<CodeWindow showTrafficLights showCaret>
				{#snippet title()}
					<span class="json-method">GET</span>
					<span class="text-gray-400"> /api/search?imdb=tt0111161&amp;lang=en</span>
				{/snippet}
				<JsonHighlight source={searchResponse} />
			</CodeWindow>
		</div>
	</div>
</section>

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

	@media (prefers-reduced-motion: reduce) {
		.hero-glow,
		.hero-grid,
		.hero-dots,
		.hero-sweep,
		.hero-copy,
		.hero-terminal {
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
