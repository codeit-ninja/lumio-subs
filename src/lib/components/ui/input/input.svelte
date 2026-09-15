<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { ClassValue } from 'tailwind-variants';

	import { inputVariants } from './input.styles.js';

	type Props = Omit<HTMLInputAttributes, 'value'> & {
		value?: string | number | readonly string[] | undefined;
	};

	let { class: className, value = $bindable(), oninput, ...restProps }: Props = $props();

	const classes = $derived(inputVariants({ class: className as ClassValue }));
</script>

<input
	{...restProps}
	{value}
	class={classes}
	oninput={(e) => {
		value = e.currentTarget.value;
		oninput?.(e);
	}}
/>
