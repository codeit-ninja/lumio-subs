<script lang="ts">
	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();
</script>

<h3 class="text-lg font-semibold tracking-tight">{ctx.plan.name}</h3>
