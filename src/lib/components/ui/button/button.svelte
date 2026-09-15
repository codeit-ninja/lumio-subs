<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import type { ButtonVariantProps } from './button.styles.js';
	import { buttonVariants } from './button.styles.js';

	type Props = ButtonPrimitive.RootProps &
		ButtonVariantProps & {
			children?: Snippet;
		};

	const {
		variant = 'primary',
		size = 'md',
		class: className,
		children,
		...restProps
	}: Props = $props();

	const classes = $derived(buttonVariants({ variant, size, class: className as ClassValue }));
</script>

<ButtonPrimitive.Root {...restProps} class={classes}>
	{@render children?.()}
</ButtonPrimitive.Root>
