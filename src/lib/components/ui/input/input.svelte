<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'value'> & {
		value?: string | number | readonly string[] | undefined;
	};

	let { class: className = '', value = $bindable(), oninput, ...restProps }: Props = $props();
</script>

<input
	{...restProps}
	{value}
	class={['field-input', className]}
	oninput={(e) => {
		value = e.currentTarget.value;
		oninput?.(e);
	}}
/>
