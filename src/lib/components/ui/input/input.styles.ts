import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

export const inputVariants = tv({
	base: [
		'box-border w-full rounded-input border border-border bg-surface',
		'px-3 py-2 text-base leading-normal text-foreground outline-none',
		'transition-colors duration-150',
		'placeholder:text-muted',
		'hover:enabled:border-border-strong',
		'focus-visible:border-primary-400',
		'disabled:cursor-not-allowed disabled:opacity-55',
		'aria-invalid:border-favorite/55',
		// Chrome autofill (keeps dark surface; Chrome forces light bg with !important)
		'[&:-webkit-autofill]:[-webkit-text-fill-color:var(--color-foreground)]',
		'[&:-webkit-autofill]:[caret-color:var(--color-foreground)]',
		'[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--color-surface)]',
		'[&:-webkit-autofill]:![border-color:var(--color-border)]',
		'[&:-webkit-autofill]:[transition:background-color_99999s_ease-out]',
		'[&:-webkit-autofill:focus-visible]:![border-color:var(--color-primary-400)]'
	]
});

export type InputVariantProps = VariantProps<typeof inputVariants>;
