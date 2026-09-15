<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'tailwind-variants';

	import { tabsContentVariants } from './tabs.styles.js';

	type Props = TabsPrimitive.ContentProps & {
		children?: Snippet;
	};

	const { class: className, children, ...restProps }: Props = $props();

	const classes = $derived(tabsContentVariants({ class: className as ClassValue }));
</script>

<TabsPrimitive.Content {...restProps} class={classes} tabindex={-1}>
	{@render children?.()}
</TabsPrimitive.Content>
