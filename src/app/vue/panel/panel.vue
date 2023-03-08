<template>
	<div id="divShade" :class="{ 'show': showPanel }" @mousedown="hide" @touchstart.passive="hide"></div>
	<aside class="scroll-shadow p-3" :class="{ 'show': showPanel }" ref="panel" v-on:contextmenu.stop="onContextMenu($event)">
		<template v-if="Studio.project">
			<Design v-if="Studio.selections.length == 0" :design="Studio.project.design" />
			<div v-else-if="Studio.selections.length == 1">
				<Repository v-if="repository" :repository="repository" />
				<component v-else :is="componentMap[type]" :subject="Studio.selection" />
			</div>
			<div v-else>
				<Flaps v-if="type == 'Flap'" :design="Studio.project.design" />
				<Vertices v-if="type == 'Vertex'" :design="Studio.project.design" />
			</div>
		</template>
	</aside>
</template>

<script lang="ts">
	export function show(): void { showPanel.value = true; }
	export function hide(): void { showPanel.value = false; }
	export function toggle(): void { showPanel.value = !showPanel.value; }
	watch(() => Studio.project, v => {
		if(!v) hide();
	});

	export default { name: "Panel" };
</script>

<script setup lang="ts">
	import { computed, shallowRef, watch } from "vue";

	import Studio, { showPanel } from "app/services/studioService";
	import Repository from "./repository.vue";
	import Vertex from "./vertex.vue";
	import Edge from "./edge.vue";
	import Flap from "./flap.vue";
	import River from "./river.vue";
	import Design from "./design.vue";
	import Flaps from "./flaps.vue";
	import Vertices from "./vertices.vue";

	import type { Component } from "vue";

	defineEmits(["hide"]);

	const panel = shallowRef<HTMLDivElement>();

	const repository = null;
	//		public get repository(): BP.Repository | null {
	// 			return core.initialized && this.bp.getRepository() || null;
	// 		}

	const componentMap: Record<string, Component> = { Vertex, Edge, Flap, River };
	const type = computed(() => Studio.selections[0]?.type ?? "");

	watch(() => Studio.project?.design.mode, () => {
		// 切換檢視的時候，如果有任何文字輸入框正在使用，則讓它失去焦點
		const el = document.activeElement as HTMLElement;
		if(el && panel.value?.contains(el)) el.blur();
	});

	function onContextMenu(event: Event): void {
		// 不允許文字框以外的部份使用系統右鍵選單
		if(!(event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement)) {
			event.preventDefault();
		}
	}

</script>

<style>
	.panel-title {
		line-height: 1.5;
		white-space: nowrap;
	}

	.panel-grid {
		display: grid;
		grid-template-columns: minmax(4rem, max-content) 1fr;
		grid-gap: 0.5rem 1rem;
	}
</style>
