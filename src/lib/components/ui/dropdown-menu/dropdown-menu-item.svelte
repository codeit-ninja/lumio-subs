<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { dropdownMenuItemVariants } from './dropdown-menu.styles.js';

	type Props = DropdownMenuPrimitive.ItemProps & {
		children?: Snippet;
	};

	let { class: className, children, ref = $bindable(null), ...restProps }: Props = $props();

	const classes = $derived(dropdownMenuItemVariants({ class: className as ClassValue }));
</script>

<DropdownMenuPrimitive.Item bind:ref {...restProps} class={classes}>
	{@render children?.()}
</DropdownMenuPrimitive.Item>
