<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Tabs } from '#lib/components/ui/tabs/index.js';

	import { login, register } from '../../auth.remote.js';

	let tab = $state('login');
</script>

<div class="flex h-dvh flex-col overflow-hidden lg:flex-row">
	<aside
		class="auth-hero relative flex h-44 shrink-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--color-primary-950)_0%,_transparent_55%),linear-gradient(to_bottom,_var(--color-background),_var(--color-surface))] lg:h-auto lg:w-1/2"
	>
		<div class="auth-hero-pattern pointer-events-none absolute inset-0" aria-hidden="true"></div>
		<div class="relative z-10 flex h-full flex-col justify-end gap-2 p-6 lg:justify-center lg:p-12">
			<a
				href="/"
				class="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground"
			>
				<img src="/logo.svg" alt="" width="24" height="24" class="size-6 rounded-md" />
				<span class="text-xl">SubREST</span>
			</a>
			<p class="max-w-sm text-sm text-zinc-300 lg:text-base">
				Subtitle search and downloads for your apps — sign in to manage your account.
			</p>
		</div>
	</aside>

	<section class="min-h-0 flex-1 overflow-y-auto [overflow-anchor:none]">
		<div class="flex min-h-full items-start justify-center px-4 py-10 lg:items-center lg:px-10">
			<div class="w-full max-w-md space-y-6">
				<div class="space-y-1">
					<h1 class="text-2xl font-semibold tracking-tight">Welcome</h1>
					<p class="text-sm text-muted">Log in or create an account to continue.</p>
				</div>

				{#if register.result?.ok}
					<div class="space-y-4 rounded-button border border-border bg-surface p-5" role="status">
						<div class="flex items-start gap-3">
							<Icon icon="lucide:mail-check" class="mt-0.5 size-5 shrink-0 text-primary" />
							<div class="space-y-1">
								<p class="font-medium">Check your email</p>
								<p class="text-sm text-muted">
									We sent a verification link to
									<span class="text-foreground">{register.result.email}</span>. Open it to activate
									your account.
								</p>
							</div>
						</div>
						<Button href="/login" variant="secondary" size="sm" data-sveltekit-reload>
							Back to login
						</Button>
					</div>
				{:else}
					<Tabs bind:value={tab}>
						<Tabs.List>
							<Tabs.Trigger value="login">Login</Tabs.Trigger>
							<Tabs.Trigger value="register">Create account</Tabs.Trigger>
						</Tabs.List>

						<!-- Only mount the active form so Chrome autofill cannot target hidden fields. -->
						{#if tab === 'login'}
							<Tabs.Content value="login">
								<form {...login} class="space-y-4">
									{#each login.fields.allIssues() ?? [] as issue (issue.message)}
										<p class="text-sm text-favorite">{issue.message}</p>
									{/each}

									<div class="space-y-1.5">
										<label class="text-sm font-medium" for="login-email">Email</label>
										<Input
											id="login-email"
											autocomplete="email"
											placeholder="you@example.com"
											{...login.fields.email.as('email')}
										/>
										{#each login.fields.email.issues() ?? [] as issue (issue.message)}
											<p class="text-sm text-favorite">{issue.message}</p>
										{/each}
									</div>

									<div class="space-y-1.5">
										<label class="text-sm font-medium" for="login-password">Password</label>
										<Input
											id="login-password"
											autocomplete="current-password"
											placeholder="••••••••"
											{...login.fields.password.as('password')}
										/>
										{#each login.fields.password.issues() ?? [] as issue (issue.message)}
											<p class="text-sm text-favorite">{issue.message}</p>
										{/each}
									</div>

									<Button type="submit" class="w-full" loading={login.pending > 0}>
										{#if !login.pending}
											<Icon icon="lucide:log-in" class="size-4 shrink-0" />
										{/if}
										Sign in
									</Button>
								</form>
							</Tabs.Content>
						{:else}
							<Tabs.Content value="register">
								<form {...register} class="space-y-4">
									{#each register.fields.allIssues() ?? [] as issue (issue.message)}
										<p class="text-sm text-favorite">{issue.message}</p>
									{/each}

									<div class="space-y-1.5">
										<label class="text-sm font-medium" for="register-name">
											Name <span class="font-normal text-muted">(optional)</span>
										</label>
										<Input
											id="register-name"
											autocomplete="name"
											placeholder="Display name"
											{...register.fields.name.as('text')}
										/>
										{#each register.fields.name.issues() ?? [] as issue (issue.message)}
											<p class="text-sm text-favorite">{issue.message}</p>
										{/each}
									</div>

									<div class="space-y-1.5">
										<label class="text-sm font-medium" for="register-email">Email</label>
										<Input
											id="register-email"
											autocomplete="email"
											placeholder="you@example.com"
											{...register.fields.email.as('email')}
										/>
										{#each register.fields.email.issues() ?? [] as issue (issue.message)}
											<p class="text-sm text-favorite">{issue.message}</p>
										{/each}
									</div>

									<div class="space-y-1.5">
										<label class="text-sm font-medium" for="register-password">Password</label>
										<Input
											id="register-password"
											autocomplete="new-password"
											placeholder="At least 8 characters"
											{...register.fields.password.as('password')}
										/>
										{#each register.fields.password.issues() ?? [] as issue (issue.message)}
											<p class="text-sm text-favorite">{issue.message}</p>
										{/each}
									</div>

									<div class="space-y-1.5">
										<label class="text-sm font-medium" for="register-password-confirm"
											>Confirm password</label
										>
										<Input
											id="register-password-confirm"
											autocomplete="new-password"
											placeholder="Repeat password"
											{...register.fields.passwordConfirm.as('password')}
										/>
										{#each register.fields.passwordConfirm.issues() ?? [] as issue (issue.message)}
											<p class="text-sm text-favorite">{issue.message}</p>
										{/each}
									</div>

									<Button type="submit" class="w-full" loading={register.pending > 0}>
										{#if !register.pending}
											<Icon icon="lucide:user-plus" class="size-4 shrink-0" />
										{/if}
										Create account
									</Button>
								</form>
							</Tabs.Content>
						{/if}
					</Tabs>
				{/if}

				<p class="text-center text-sm text-muted">
					<a href="/" class="inline-flex items-center gap-1.5 hover:text-foreground">
						<Icon icon="lucide:arrow-left" class="size-3.5 shrink-0" />
						Back to home
					</a>
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.auth-hero-pattern {
		opacity: 0.55;
		background-image:
			radial-gradient(
				circle at 1px 1px,
				color-mix(in srgb, var(--color-primary) 28%, transparent) 1px,
				transparent 0
			),
			linear-gradient(
				to bottom,
				transparent 0%,
				color-mix(in srgb, var(--color-background) 35%, transparent) 100%
			);
		background-size:
			22px 22px,
			100% 100%;
		mask-image: linear-gradient(to bottom, black 20%, transparent 95%);
	}

	@media (min-width: 1024px) {
		.auth-hero-pattern {
			mask-image: linear-gradient(to right, black 35%, transparent 100%);
		}
	}
</style>
