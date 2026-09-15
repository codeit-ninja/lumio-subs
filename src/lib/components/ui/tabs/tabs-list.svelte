<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { tabsListVariants } from './tabs.styles.js';

	type Props = TabsPrimitive.ListProps & {
		children?: Snippet;
	};

	const { class: className, children, ...restProps }: Props = $props();

	const classes = $derived(tabsListVariants({ class: className as ClassValue }));
</script>

<TabsPrimitive.List {...restProps} class={classes}>
	{@render children?.()}
</TabsPrimitive.List>
