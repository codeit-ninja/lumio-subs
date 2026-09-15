import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

export const tabsListVariants = tv({
	base: [
		'inline-flex w-full items-center gap-1',
		'rounded-button border border-border bg-surface p-1'
	]
});

export const tabsTriggerVariants = tv({
	base: [
		'inline-flex flex-1 items-center justify-center gap-2',
		'rounded-[calc(var(--radius-button)-2px)] px-3 py-2',
		'cursor-pointer text-sm font-medium text-muted',
		'transition-colors duration-150',
		'hover:text-foreground',
		'disabled:cursor-not-allowed disabled:opacity-55',
		'data-[state=active]:bg-surface-elevated data-[state=active]:text-foreground'
	]
});

export const tabsContentVariants = tv({
	base: 'mt-4 outline-none'
});

export type TabsListVariantProps = VariantProps<typeof tabsListVariants>;
export type TabsTriggerVariantProps = VariantProps<typeof tabsTriggerVariants>;
export type TabsContentVariantProps = VariantProps<typeof tabsContentVariants>;
