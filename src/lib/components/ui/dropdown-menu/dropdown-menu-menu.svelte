<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	import type { DropdownMenuItem } from './dropdown-menu.types.js';
	import Content from './dropdown-menu-content.svelte';
	import Group from './dropdown-menu-group.svelte';
	import Items from './dropdown-menu-items.svelte';
	import Label from './dropdown-menu-label.svelte';
	import Portal from './dropdown-menu-portal.svelte';
	import Separator from './dropdown-menu-separator.svelte';
	import Trigger from './dropdown-menu-trigger.svelte';

	type Props = DropdownMenuPrimitive.RootProps & {
		header?: string;
		items: DropdownMenuItem[];
		trigger: Snippet;
		triggerClass?: ClassValue;
		contentClass?: ClassValue;
		'aria-label'?: string;
	};

	let {
		header,
		items,
		trigger,
		triggerClass,
		contentClass = 'w-56',
		'aria-label': ariaLabel,
		open = $bindable(false),
		...restProps
	}: Props = $props();
</script>

<DropdownMenuPrimitive.Root bind:open {...restProps}>
	<Trigger class={triggerClass} aria-label={ariaLabel}>
		{@render trigger()}
	</Trigger>
	<Portal>
		<Content class={contentClass}>
			{#if header}
				<Group>
					<Label class="truncate font-normal">{header}</Label>
				</Group>
				<Separator />
			{/if}
			<Items {items} />
		</Content>
	</Portal>
</DropdownMenuPrimitive.Root>
