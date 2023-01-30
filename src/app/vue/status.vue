<template>
	<footer class="py-1 px-3">
		<div v-if="Studio.project" class="d-flex">
			<div v-if="!isTouch" style="width: 80px;">
				<i class="fas fa-mouse-pointer me-2"></i>
				<span v-if="Studio.mouseCoordinates">
					{{ Studio.mouseCoordinates.x }}, {{ Studio.mouseCoordinates.y }}
				</span>
			</div>
			<template v-if="Studio.project.design.mode == 'layout'">
				<div style="width: 90px;">
					{{ $t("panel.flaps.type") }}: {{ flapCount }}
				</div>
				<div style="width: 90px;">
					{{ $t("panel.rivers.type") }}: {{ Studio.project.design.riverCount }}
				</div>
			</template>
			<div v-else style="width: 180px;">
				{{ $t("panel.vertices.type") }}: {{ vertexCount }}
			</div>
		</div>
	</footer>
</template>

<script lang="ts">
	export default { name: "Statusbar" };
</script>

<script setup lang="ts">
	import { computed } from "vue";

	import Studio from "app/services/studioService";
	import { isTouch } from "app/shared/constants";

	const type = computed(() => Studio.selections[0]?.type ?? "");

	const flapCount = computed(() => {
		if(!Studio.project) return "";
		const selected = type.value == "Flap" ? Studio.selections.length + " / " : "";
		return selected + Studio.project.design.flapCount;
	});

	const vertexCount = computed(() => {
		if(!Studio.project) return "";
		const selected = type.value == "Vertex" ? Studio.selections.length + " / " : "";
		return selected + Studio.project.design.vertexCount;
	});

</script>
