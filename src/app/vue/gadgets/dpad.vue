<template>
	<div id="divDPad" v-bind:class="{ 'show': show, 'disabled': Studio.isDragging }">
		<KeyButton icon="bp-up" style="top: -0.5rem; left: 2rem;" dir="up" />
		<KeyButton icon="bp-left" style="top: 2rem; left: -0.5rem;" dir="left" />
		<KeyButton icon="bp-right" style="top: 2rem; left: 4.5rem;" dir="right" />
		<KeyButton icon="bp-down" style="top: 4.5rem; left: 2rem;" dir="down" />
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import Studio, { showPanel } from "app/services/studioService";
	import KeyButton from "./keyButton.vue";

	defineOptions({ name: "DPad" });

	const show = computed(() => Studio.shouldShowDPad && !showPanel.value);

</script>
