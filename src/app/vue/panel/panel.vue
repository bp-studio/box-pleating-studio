<template>
	<div id="divShade" :class="{ 'show': showPanel }" @mousedown="hide" @touchstart.prevent="hide"></div>
	<aside class="scroll-shadow p-3" :class="{ 'show': showPanel }" ref="panel" v-on:contextmenu.stop="onContextMenu($event)">
		<template v-if="design">
			<Design v-if="Studio.selections.length == 0" :design="design" />
			<div v-else-if="Studio.selections.length == 1">
				<StretchVue v-if="Studio.stretch" :stretch="Studio.stretch" />
				<component v-else-if="isFlap(Studio.selection)" :is="FlapVue" :subject="Studio.selection" :max="design.sheet.grid.diameter" />
				<component v-else :is="componentMap[type]" :subject="Studio.selection" />
			</div>
			<div v-else>
				<Flaps v-if="type == 'Flap'" :design="design" />
				<Vertices v-if="type == 'Vertex'" :design="design" />
			</div>
		</template>
	</aside>
</template>

<script lang="ts">
	export function show(): void { showPanel.value = true; }
	export function hide(): void { showPanel.value = false; }
	export function toggle(): void { showPanel.value = !showPanel.value; }
</script>

<script setup lang="ts">

	import { computed, onMounted, shallowRef, watch } from "vue";

	import Studio, { showPanel } from "app/services/studioService";
	import StretchVue from "./stretch.vue";
	import Vertex from "./vertex.vue";
	import Edge from "./edge.vue";
	import FlapVue from "./flap.vue";
	import River from "./river.vue";
	import Design from "./design.vue";
	import Flaps from "./flaps.vue";
	import Vertices from "./vertices.vue";

	import type { Control } from "client/base/control";
	import type { Flap } from "client/project/components/layout/flap";
	import type { Component } from "vue";

	defineOptions({ name: "Panel" });

	defineEmits(["hide"]);

	const panel = shallowRef<HTMLDivElement>();

	const componentMap: Record<string, Component> = { Vertex, Edge, FlapVue, River };
	const type = computed(() => Studio.selections[0]?.type ?? "");
	const design = computed(() => Studio.project?.design);

	onMounted(() => {
		watch(() => Studio.project, v => {
			if(!v) hide();
		});

		watch(() => design.value?.mode, () => {
			// If any text fields are in used during view switching, unfocus it.
			const el = document.activeElement as HTMLElement;
			if(el && panel.value?.contains(el)) el.blur();
		});
	});

	function onContextMenu(event: Event): void {
		// Disable context menu outside text fields.
		if(!(event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement)) {
			event.preventDefault();
		}
	}

	function isFlap(control: Control): control is Flap {
		return control.type === "Flap";
	}

</script>

<style>
	.panel-title {
		line-height: 1.5;
		white-space: nowrap;
	}

	.panel-grid {
		display: grid;
		grid-gap: 0.5rem 1rem;

		/* DoIUse data seems wrong here, see https://caniuse.com/mdn-css_properties_grid-template-columns_minmax */
		/* stylelint-disable-next-line plugin/no-unsupported-browser-features */
		grid-template-columns: minmax(4rem, max-content) 1fr;
	}
</style>
