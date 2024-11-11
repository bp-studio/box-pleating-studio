<template>
	<div v-on:touchstart.passive="down(750, $event)" v-on:touchend="up" v-on:touchcancel="up">
		<i :class="icon" />
	</div>
</template>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import { useThrottledGA } from "app/utils/ga";

	import type { DirectionKey } from "shared/types/types";

	const ONE_HOUR = 3600000;

	defineOptions({ name: "KeyButton" });

	let to: number;

	const props = defineProps<{
		dir: DirectionKey;
		icon: string;
		show: boolean;
	}>();
	const ga = useThrottledGA("dpad", ONE_HOUR);

	function down(repeat: number, e?: Event): void {
		const SENSITIVITY = 150;
		if(props.show) {
			Studio.dragByKey(props.dir);
			to = setTimeout(() => down(SENSITIVITY), repeat);
		} else {
			up();
		}
	}

	function up(): void {
		ga();
		clearTimeout(to);
	}

</script>
