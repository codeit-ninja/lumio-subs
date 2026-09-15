<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = DropdownMenuPrimitive.PortalProps & {
		children?: Snippet;
	};

	let { children, ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Portal {...restProps}>
	{@render children?.()}
</DropdownMenuPrimitive.Portal>
