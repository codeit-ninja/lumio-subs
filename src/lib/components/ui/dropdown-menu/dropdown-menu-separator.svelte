<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { ClassValue } from 'tailwind-variants';

	import { dropdownMenuSeparatorVariants } from './dropdown-menu.styles.js';

	type Props = DropdownMenuPrimitive.SeparatorProps;

	const { class: className, ...restProps }: Props = $props();

	const classes = $derived(dropdownMenuSeparatorVariants({ class: className as ClassValue }));
</script>

<DropdownMenuPrimitive.Separator {...restProps} class={classes} />
