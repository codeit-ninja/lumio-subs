<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { tabsTriggerVariants } from './tabs.styles.js';

	type Props = TabsPrimitive.TriggerProps & {
		children?: Snippet;
	};

	const { class: className, children, ...restProps }: Props = $props();

	const classes = $derived(tabsTriggerVariants({ class: className as ClassValue }));
</script>

<TabsPrimitive.Trigger {...restProps} class={classes}>
	{@render children?.()}
</TabsPrimitive.Trigger>
