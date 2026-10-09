<template>
	<div id="divDPad" :class="{ 'show': show && !showPanel, 'disabled': Studio.isDragging }">
		<KeyButton
			:show="show"
			icon="bp-arrow-up"
			style="top: -0.5rem; left: 2rem;"
			dir="up"
		/>
		<KeyButton
			:show="show"
			icon="bp-arrow-left"
			style="top: 2rem; left: -0.5rem;"
			dir="left"
		/>
		<KeyButton
			:show="show"
			icon="bp-arrow-right"
			style="top: 2rem; left: 4.5rem;"
			dir="right"
		/>
		<KeyButton
			:show="show"
			icon="bp-arrow-down"
			style="top: 4.5rem; left: 2rem;"
			dir="down"
		/>
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import Studio, { showPanel } from "app/services/studioService";
	import Settings from "app/services/settingService";
	import KeyButton from "./keyButton.vue";
	import { isTouch } from "app/shared/constants";

	defineOptions({ name: "DPad" });

	const show = computed(() =>
		isTouch && Settings.showDPad && Studio.draggableSelected
	);

</script>
