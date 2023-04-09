<template>
	<nav class="btn-toolbar p-2">
		<div class="btn-group me-2">
			<FileMenu />
			<EditMenu />
			<SettingMenu />
			<ToolMenu />
			<HelpMenu />
		</div>

		<div class="btn-group me-2">
			<button type="button" class="btn btn-primary" :class="{ active: Studio.project && Studio.project.design.mode == 'tree' }"
					@click="toTree" :title="$t('toolbar.view.tree') + hk('v', 't', true)" :disabled="!Studio.project">
				<i class="bp-tree" />
			</button>
			<button type="button" class="btn btn-primary"
					:class="{ active: Studio.project && Studio.project.design.mode == 'layout' }" @click="toLayout"
					:title="$t('toolbar.view.layout') + hk('v', 'l', true)" :disabled="!Studio.project">
				<i class="bp-layout" />
			</button>
		</div>

		<TabBar v-if="phase >= 2" />

		<div class="btn-group" id="panelToggle">
			<button type="button" class="btn btn-primary" @click="toggle" :title="$t('toolbar.panel')" :disabled="!Studio.project">
				<i class="bp-sliders-h" />
			</button>
		</div>

	</nav>
</template>

<script lang="ts">
	export const tick = shallowRef(0);
	export default { name: "Toolbar" };
</script>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import { phase } from "app/misc/lcpReady";
	import Studio from "app/services/studioService";
	import { hk } from "app/services/customHotkeyService";
	import { toggle } from "@/panel/panel.vue";
	import TabBar from "./components/tabBar.vue";
	import FileMenu from "./fileMenu.vue";
	import SettingMenu from "./settingMenu.vue";
	import HelpMenu from "./helpMenu.vue";
	import EditMenu from "./editMenu.vue";
	import ToolMenu from "./toolMenu.vue";

	function toLayout(): void {
		if(Studio.project) Studio.project.design.mode = "layout";
	}
	function toTree(): void {
		if(Studio.project) Studio.project.design.mode = "tree";
	}

</script>

<style lang="scss">
	nav {
		background: var(--bg-ui);
		height: 3.75rem;
		overflow: visible;
		flex-wrap: nowrap !important;
		isolation: isolate;
	}

	@media (max-width: 650px) {
		#panelToggle {
			flex-grow: 1;
			text-align: right;
		}
	}
</style>
