<template>
	<button class="btn btn-primary" @click="StudioService.execute(click)">
		<slot></slot>
	</button>
</template>

<script setup lang="ts" >

	import StudioService from "app/services/studioService";

	/**
	 * AsyncButton is a button for executing async operations.
	 * It prevents rapid clicking.
	 *
	 * Note that we don't visually disable the button here,
	 * as the operations are supposed to be considerably quick,
	 * and disabling the button will result in flashes.
	 */
	defineOptions({ name: "AsyncButton" });

	defineProps<{
		click: Action<Promise<void>>;
	}>();

</script>
