<script lang="ts">
	import { Icon } from '#lib/components/ui/icon/index.js';

	import type { DropdownMenuItem } from './dropdown-menu.types.js';
	import Item from './dropdown-menu-item.svelte';
	import Self from './dropdown-menu-items.svelte';
	import Portal from './dropdown-menu-portal.svelte';
	import Sub from './dropdown-menu-sub.svelte';
	import SubContent from './dropdown-menu-sub-content.svelte';
	import SubTrigger from './dropdown-menu-sub-trigger.svelte';

	type Props = {
		items: DropdownMenuItem[];
	};

	const { items }: Props = $props();
</script>

{#each items as item (item.id)}
	{#if item.items?.length}
		<Sub>
			<SubTrigger disabled={item.disabled}>
				{#if item.loading}
					<Icon icon="lucide:loader-circle" class="size-3.5 shrink-0 animate-spin" />
				{:else if item.icon}
					<Icon icon={item.icon} class="size-3.5 shrink-0" />
				{/if}
				<span class="truncate">{item.label}</span>
			</SubTrigger>
			<Portal>
				<SubContent>
					<Self items={item.items} />
				</SubContent>
			</Portal>
		</Sub>
	{:else if item.form}
		<form {...item.form}>
			<Item disabled={item.disabled || item.loading}>
				{#snippet child({ props })}
					<button {...props} type="submit">
						{#if item.loading}
							<Icon icon="lucide:loader-circle" class="size-3.5 shrink-0 animate-spin" />
						{:else if item.icon}
							<Icon icon={item.icon} class="size-3.5 shrink-0" />
						{/if}
						{item.label}
					</button>
				{/snippet}
			</Item>
		</form>
	{:else if item.href}
		<Item disabled={item.disabled || item.loading}>
			{#snippet child({ props })}
				<a {...props} href={item.href}>
					{#if item.loading}
						<Icon icon="lucide:loader-circle" class="size-3.5 shrink-0 animate-spin" />
					{:else if item.icon}
						<Icon icon={item.icon} class="size-3.5 shrink-0" />
					{/if}
					{item.label}
				</a>
			{/snippet}
		</Item>
	{:else}
		<Item
			disabled={item.disabled || item.loading}
			onSelect={() => {
				item.onSelect?.();
			}}
		>
			{#if item.loading}
				<Icon icon="lucide:loader-circle" class="size-3.5 shrink-0 animate-spin" />
			{:else if item.icon}
				<Icon icon={item.icon} class="size-3.5 shrink-0" />
			{/if}
			{item.label}
		</Item>
	{/if}
{/each}
