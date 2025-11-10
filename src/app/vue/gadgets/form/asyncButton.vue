<template>
	<button class="btn btn-primary" @click="StudioService.execute(click)">
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
	export default {
		name: "AsyncButton",
	};
</script>

<script setup lang="ts" >

	import StudioService from "app/services/studioService";

	defineProps<{
		click: Action<Promise<void>>;
	}>();

</script>
