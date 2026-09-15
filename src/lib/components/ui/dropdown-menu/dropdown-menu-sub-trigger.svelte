<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { Icon } from '#lib/components/ui/icon/index.js';

	import { dropdownMenuItemVariants } from './dropdown-menu.styles.js';

	type Props = DropdownMenuPrimitive.SubTriggerProps & {
		children?: Snippet;
	};

	let { class: className, children, ref = $bindable(null), ...restProps }: Props = $props();

	const classes = $derived(
		dropdownMenuItemVariants({
			class: ['justify-between', className as ClassValue]
		})
	);
</script>

<DropdownMenuPrimitive.SubTrigger bind:ref {...restProps} class={classes}>
	<span class="flex min-w-0 flex-1 items-center gap-2">
		{@render children?.()}
	</span>
	<Icon icon="lucide:chevron-right" class="size-3.5 shrink-0 text-muted" />
</DropdownMenuPrimitive.SubTrigger>
