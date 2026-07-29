<template>
	<div @touchstart.passive="down(750, $event)" @touchend="up" @touchcancel="up">
		<i :class="icon"/>
	</div>
</template>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import { useThrottledGA } from "app/utils/ga";

	import type { DirectionKey } from "shared/types/types";

	defineOptions({ name: "KeyButton" });

	const props = defineProps<{
		dir: DirectionKey;
		icon: string;
		show: boolean;
	}>();

	const ONE_HOUR = 3600000;

	let to: number;

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
