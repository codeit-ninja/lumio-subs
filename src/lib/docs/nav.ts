export type DocsNavLink = {
	href: string;
	label: string;
};

export type DocsNavSection = {
	title: string;
	items: DocsNavLink[];
};

export const docsNav: DocsNavSection[] = [
	{
		title: 'Guides',
		items: [
			{ href: '/docs', label: 'Introduction' },
			{ href: '/docs/getting-started', label: 'Getting started' },
			{ href: '/docs/authentication', label: 'Authentication' }
		]
	},
	{
		title: 'API',
		items: [{ href: '/docs/api', label: 'Overview' }]
	}
];

export function isDocsNavActive(pathname: string, href: string): boolean {
	if (href === '/docs') {
		return pathname === '/docs' || pathname === '/docs/';
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function getDocsNavFlat(): DocsNavLink[] {
	return docsNav.flatMap((section) => section.items);
}

export function getDocsAdjacent(pathname: string): {
	prev: DocsNavLink | null;
	next: DocsNavLink | null;
} {
	const items = getDocsNavFlat();
	const index = items.findIndex((item) => isDocsNavActive(pathname, item.href));
	if (index < 0) {
		return { prev: null, next: null };
	}
	return {
		prev: index > 0 ? items[index - 1]! : null,
		next: index < items.length - 1 ? items[index + 1]! : null
	};
}
