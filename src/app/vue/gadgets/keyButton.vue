<template>
	<div @touchstart.passive="down(750, $event)" @touchend="up" @touchcancel="up">
		<i :class="icon"/>
	</div>
</template>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import Analytics from "app/services/analyticsService";

	import type { DirectionKey } from "shared/types/types";

	defineOptions({ name: "KeyButton" });

	const props = defineProps<{
		dir: DirectionKey;
		icon: string;
		show: boolean;
	}>();

	const ONE_HOUR = 3600000;

	let to: number;

	const ga = Analytics.throttled("dpad", ONE_HOUR);

	function down(repeat: number, e?: Event): void {
		const SENSITIVITY = 150;
		if(props.show) {
			if(Studio.dragByKey(props.dir)) Analytics.input("move", "dpad");
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
