export type ParamField = {
	name: string;
	label?: string;
	placeholder?: string;
	required?: boolean;
	/** 'text' | 'select' */
	kind?: 'text' | 'select';
	options?: { value: string; label: string }[];
};
