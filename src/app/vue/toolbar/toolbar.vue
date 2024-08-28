<template>
	<nav class="btn-toolbar p-2">
		<!--
			Since most menus are loaded asynchronously,
			we need to hide them until we're ready.
		-->
		<div class="btn-group me-2" role="menubar" v-show="phase >= 4">
			<FileMenu />
			<EditMenu />
			<SettingMenu />
			<ToolMenu />
			<HelpMenu />
		</div>
		<StubMenu v-show="phase < 4" />

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
	import Studio from "app/services/studioService";
	import { hk } from "app/services/customHotkeyService";
	import { toggle } from "@/panel/panel.vue";
	import StubMenu from "@/toolbar/stubMenu.vue";
	import TabBar from "./components/tabBar.vue";
	import ToolMenu from "./toolMenu.vue";

	const FileMenu = asyncComp(() => import("./fileMenu.vue"), true);
	const EditMenu = asyncComp(() => import("./editMenu.vue"), true);
	const SettingMenu = asyncComp(() => import("./settingMenu.vue"), true);
	const HelpMenu = asyncComp(() => import("./helpMenu.vue"), true);

	defineOptions({ name: "Toolbar" });

	function toLayout(): void {
		if(Studio.project) Studio.project.design.mode = "layout";
	}
	function toTree(): void {
		if(Studio.project) Studio.project.design.mode = "tree";
	}

</script>
