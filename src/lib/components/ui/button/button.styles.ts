import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

export const buttonVariants = tv({
	base: [
		'inline-flex items-center justify-center gap-2',
		'rounded-button border border-transparent',
		'cursor-pointer font-medium',
		'transition-colors duration-150',
		'disabled:cursor-not-allowed disabled:opacity-55'
	],
	variants: {
		variant: {
			primary: 'bg-primary text-foreground hover:bg-primary-600',
			secondary:
				'border-border bg-surface-elevated text-foreground hover:border-border-strong hover:bg-gray-700',
			favorite:
				'border-favorite/40 bg-[color-mix(in_srgb,var(--color-favorite)_14%,var(--color-surface))] text-favorite hover:border-favorite/60',
			ghost: 'bg-transparent text-muted hover:bg-surface hover:text-foreground'
		},
		size: {
			sm: 'gap-2 px-3 py-1.5 text-xs xl:px-3.5 xl:py-2 xl:text-sm',
			md: 'gap-2 px-4 py-2 text-sm xl:px-5 xl:py-2.5 xl:text-base',
			lg: 'gap-2.5 px-5 py-2.5 text-base xl:px-6 xl:py-3 xl:text-lg'
		}
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md'
	}
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
