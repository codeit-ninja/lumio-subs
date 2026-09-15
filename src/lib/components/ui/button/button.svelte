<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { Icon } from '#lib/components/ui/icon/index.js';

	import type { ButtonVariantProps } from './button.styles.js';
	import { buttonVariants } from './button.styles.js';

	type Props = ButtonPrimitive.RootProps &
		ButtonVariantProps & {
			children?: Snippet;
			loading?: boolean;
		};

	const {
		variant = 'primary',
		size = 'md',
		class: className,
		children,
		loading = false,
		disabled,
		...restProps
	}: Props = $props();

	const classes = $derived(buttonVariants({ variant, size, class: className as ClassValue }));
	const spinnerClass = $derived(
		size === 'sm' ? 'size-3.5 shrink-0 animate-spin' : 'size-4 shrink-0 animate-spin'
	);
</script>

<ButtonPrimitive.Root
	{...restProps}
	disabled={disabled || loading}
	aria-busy={loading ? true : undefined}
	class={classes}
>
	{#if loading}
		<Icon icon="lucide:loader-circle" class={spinnerClass} />
	{/if}
	{@render children?.()}
</ButtonPrimitive.Root>
