<template>
	<nav class="btn-toolbar p-2">
		<Suspense>
			<Menus />
			<template #fallback>
				<StubMenu />
			</template>
		</Suspense>

		<div class="btn-group me-2" role="toolbar">
			<button type="button" class="btn btn-primary"
				:class="{ active: Studio.project && Studio.project.design.mode == 'tree' }" @click="toTree"
				:title="$t('toolbar.view.tree') + hk('v', 't', true)" :disabled="!Studio.project">
				<i class="bp-tree" />
			</button>
			<button type="button" class="btn btn-primary"
				:class="{ active: Studio.project && Studio.project.design.mode == 'layout' }" @click="toLayout"
				:title="$t('toolbar.view.layout') + hk('v', 'l', true)" :disabled="!Studio.project">
				<i class="bp-layout" />
			</button>
		</div>

		<TabBar v-if="phase >= 5" />
		<div v-else class="flex-grow-1" />

		<div class="btn-group" id="panelToggle">
			<button type="button" class="btn btn-primary" @click="toggle" :title="$t('toolbar.panel')"
				:disabled="!Studio.project">
				<i class="bp-sliders-h" />
			</button>
		</div>

	</nav>
</template>

<script setup lang="ts">

	import { phase, asyncComp } from "app/misc/phase";
	import Studio, { showPanel } from "app/services/studioService";
	import { hk } from "app/services/customHotkeyService";
	import StubMenu from "@/toolbar/stubMenu.vue";
	import TabBar from "./components/tabBar.vue";

	const Menus = asyncComp(() => import("./menus.vue"), true);

	defineOptions({ name: "Toolbar" });

	function toggle(): void {
		showPanel.value = !showPanel.value;
	}

	function toLayout(): void {
		if(Studio.project) Studio.project.design.mode = "layout";
	}

	function toTree(): void {
		if(Studio.project) Studio.project.design.mode = "tree";
	}

</script>
