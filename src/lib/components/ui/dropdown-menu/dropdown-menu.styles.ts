import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

export const dropdownMenuContentVariants = tv({
	base: [
		'z-50 min-w-48 overflow-hidden rounded-button border border-border bg-surface p-1',
		'shadow-lg outline-none'
	]
});

export const dropdownMenuItemVariants = tv({
	base: [
		'flex w-full cursor-pointer items-center gap-2 rounded-[calc(var(--radius-button)-2px)]',
		'px-2 py-1.5 text-sm text-foreground',
		'outline-none select-none',
		'data-highlighted:bg-surface-elevated',
		'data-[disabled]:pointer-events-none data-[disabled]:opacity-55'
	]
});

export const dropdownMenuLabelVariants = tv({
	base: 'px-2 py-1.5 text-xs text-muted'
});

export const dropdownMenuSeparatorVariants = tv({
	base: '-mx-1 my-1 h-px bg-border'
});

export type DropdownMenuContentVariantProps = VariantProps<typeof dropdownMenuContentVariants>;
export type DropdownMenuItemVariantProps = VariantProps<typeof dropdownMenuItemVariants>;
export type DropdownMenuLabelVariantProps = VariantProps<typeof dropdownMenuLabelVariants>;
export type DropdownMenuSeparatorVariantProps = VariantProps<typeof dropdownMenuSeparatorVariants>;
