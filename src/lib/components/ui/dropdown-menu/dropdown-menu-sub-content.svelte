<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { dropdownMenuContentVariants } from './dropdown-menu.styles.js';

	type Props = DropdownMenuPrimitive.SubContentProps & {
		children?: Snippet;
	};

	let {
		class: className,
		children,
		sideOffset = 4,
		ref = $bindable(null),
		...restProps
	}: Props = $props();

	const classes = $derived(dropdownMenuContentVariants({ class: className as ClassValue }));
</script>

<DropdownMenuPrimitive.SubContent bind:ref {sideOffset} {...restProps} class={classes}>
	{@render children?.()}
</DropdownMenuPrimitive.SubContent>
