<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { dropdownMenuLabelVariants } from './dropdown-menu.styles.js';

	type Props = DropdownMenuPrimitive.GroupHeadingProps & {
		children?: Snippet;
	};

	const { class: className, children, ...restProps }: Props = $props();

	const classes = $derived(dropdownMenuLabelVariants({ class: className as ClassValue }));
</script>

<DropdownMenuPrimitive.GroupHeading {...restProps} class={classes}>
	{@render children?.()}
</DropdownMenuPrimitive.GroupHeading>
