<template>
	<button class="btn btn-primary" @click="StudioService.execute(run)">
		<slot/>
	</button>
</template>

<script lang="ts">
	/**
	 * AsyncButton is a button for executing async operations.
	 * It prevents rapid clicking.
	 *
	 * Note that we don't visually disable the button here,
	 * as the operations are supposed to be considerably quick,
	 * and disabling the button will result in flashes.
	 */
</script>

<script setup lang="ts">

	import StudioService from "app/services/studioService";
	import Analytics from "app/services/analyticsService";

	defineOptions({
		name: "AsyncButton",
	});

	const props = defineProps<{
		click: Action<Promise<void>>;
		/**
		 * The task name for {@link Analytics.input} by the method `panel`;
		 * not tracked if omitted.
		 */
		analytics?: string;
	}>();

	function run(): Promise<void> {
		if(props.analytics) Analytics.input(props.analytics, "panel");
		return props.click();
	}

</script>
