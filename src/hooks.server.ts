import { sequence } from '@sveltejs/kit/hooks';

import { boot } from './lib/server/hooks/boot';

export const handle = sequence(boot);
