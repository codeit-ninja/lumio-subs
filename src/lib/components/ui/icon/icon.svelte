<script lang="ts">
	import '#lib/icons.js';

	import IconifyIcon from '@iconify/svelte';

	type Props = {
		icon: string;
		class?: string;
		width?: string | number;
		height?: string | number;
		'aria-label'?: string;
		'aria-hidden'?: boolean | 'true' | 'false';
	};

	const {
		icon,
		class: className,
		width,
		height,
		'aria-label': ariaLabel,
		'aria-hidden': ariaHidden
	}: Props = $props();

	const resolvedAriaHidden = $derived(ariaHidden ?? (ariaLabel ? false : true));
</script>

<IconifyIcon
	{icon}
	class={className}
	{width}
	{height}
	aria-label={ariaLabel}
	aria-hidden={resolvedAriaHidden}
/>
