import Root from './tabs.svelte';
import Content from './tabs-content.svelte';
import List from './tabs-list.svelte';
import Trigger from './tabs-trigger.svelte';

const Tabs = Object.assign(Root, {
	List,
	Trigger,
	Content
});

export type {
	TabsContentVariantProps,
	TabsListVariantProps,
	TabsTriggerVariantProps
} from './tabs.styles.js';
export { tabsContentVariants, tabsListVariants, tabsTriggerVariants } from './tabs.styles.js';

export { Content, List, Root, Tabs, Trigger };
export { Content as TabsContent, List as TabsList, Trigger as TabsTrigger };
