<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	type Props = TabsPrimitive.RootProps & {
		children?: Snippet;
	};

	let {
		class: className,
		children,
		value = $bindable(''),
		ref = $bindable(null),
		...restProps
	}: Props = $props();
</script>

<TabsPrimitive.Root
	bind:value
	bind:ref
	{...restProps}
	class={['flex w-full flex-col', className as ClassValue]}
>
	{@render children?.()}
</TabsPrimitive.Root>
