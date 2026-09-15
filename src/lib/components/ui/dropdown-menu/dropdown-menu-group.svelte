<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = DropdownMenuPrimitive.GroupProps & {
		children?: Snippet;
	};

	const { class: className, children, ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Group {...restProps} class={className}>
	{@render children?.()}
</DropdownMenuPrimitive.Group>
