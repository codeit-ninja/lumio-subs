<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = DropdownMenuPrimitive.RootProps & {
		children?: Snippet;
	};

	let { children, open = $bindable(false), ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Root bind:open {...restProps}>
	{@render children?.()}
</DropdownMenuPrimitive.Root>
