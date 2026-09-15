import Root from './dropdown-menu.svelte';
import Content from './dropdown-menu-content.svelte';
import Group from './dropdown-menu-group.svelte';
import Item from './dropdown-menu-item.svelte';
import Label from './dropdown-menu-label.svelte';
import Menu from './dropdown-menu-menu.svelte';
import Portal from './dropdown-menu-portal.svelte';
import Separator from './dropdown-menu-separator.svelte';
import Sub from './dropdown-menu-sub.svelte';
import SubContent from './dropdown-menu-sub-content.svelte';
import SubTrigger from './dropdown-menu-sub-trigger.svelte';
import Trigger from './dropdown-menu-trigger.svelte';

const DropdownMenu = Object.assign(Menu, {
	Root,
	Trigger,
	Portal,
	Content,
	Group,
	Item,
	Label,
	Separator,
	Sub,
	SubTrigger,
	SubContent
});

export type {
	DropdownMenuContentVariantProps,
	DropdownMenuItemVariantProps,
	DropdownMenuLabelVariantProps,
	DropdownMenuSeparatorVariantProps
} from './dropdown-menu.styles.js';
export {
	dropdownMenuContentVariants,
	dropdownMenuItemVariants,
	dropdownMenuLabelVariants,
	dropdownMenuSeparatorVariants
} from './dropdown-menu.styles.js';
export type { DropdownMenuItem } from './dropdown-menu.types.js';

export {
	Content,
	Group,
	Item,
	Label,
	Menu,
	Portal,
	Root,
	Separator,
	Sub,
	SubContent,
	SubTrigger,
	Trigger
};
export { DropdownMenu };
export {
	Content as DropdownMenuContent,
	Group as DropdownMenuGroup,
	Item as DropdownMenuItemPrimitive,
	Label as DropdownMenuLabel,
	Menu as DropdownMenuMenu,
	Portal as DropdownMenuPortal,
	Root as DropdownMenuRoot,
	Separator as DropdownMenuSeparator,
	Sub as DropdownMenuSub,
	SubContent as DropdownMenuSubContent,
	SubTrigger as DropdownMenuSubTrigger,
	Trigger as DropdownMenuTrigger
};
