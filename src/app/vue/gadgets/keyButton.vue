<template>
	<div v-on:touchstart.passive="down(750, $event)" v-on:touchend="up" v-on:touchcancel="up">
		<i :class="icon" />
	</div>
</template>

<script lang="ts">
	export default { name: "KeyButton" };
</script>

<script setup lang="ts">

	import Studio from "app/services/studioService";

	import type { DirectionKey } from "shared/types/types";

	let to: Timeout;

	const props = defineProps<{
		dir: DirectionKey;
		icon: string;
	}>();

	function down(repeat: number, e?: Event): void {
		const SENSITIVITY = 150;
		if(Studio.shouldShowDPad) {
			Studio.dragByKey(props.dir);
			to = setTimeout(() => down(SENSITIVITY), repeat);
		} else {
			up();
		}
	}

	function up(): void {
		clearTimeout(to);
	}

</script>
