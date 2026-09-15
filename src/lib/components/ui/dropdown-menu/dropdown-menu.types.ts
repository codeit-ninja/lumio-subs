export type DropdownMenuItem = {
	id: string;
	label: string;
	icon?: string;
	href?: string;
	onSelect?: () => void;
	/** Remote form attrs (e.g. `{...logout}`) — rendered as a submit button inside `<form>`. */
	form?: Record<string, unknown>;
	disabled?: boolean;
	loading?: boolean;
	items?: DropdownMenuItem[];
};
