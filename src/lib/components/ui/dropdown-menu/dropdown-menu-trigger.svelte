<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	type Props = DropdownMenuPrimitive.TriggerProps & {
		children?: Snippet;
	};

	let { class: className, children, ref = $bindable(null), ...restProps }: Props = $props();
</script>

<DropdownMenuPrimitive.Trigger
	bind:ref
	{...restProps}
	class={['cursor-pointer outline-none', className as ClassValue]}
>
	{@render children?.()}
</DropdownMenuPrimitive.Trigger>
