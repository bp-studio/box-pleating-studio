<template>
	<nav class="btn-toolbar p-2">
		<div class="btn-group me-2">
			<FileMenu />
			<EditMenu />
			<SettingMenu />
			<Dropdown icon="bp-tools" :title="$t('toolbar.tools.title')">
				<Uploader accept=".tmd5" @upload="TreeMaker($event)">
					<i class="fas fa-file-import" />
					{{ $t("toolbar.tools.TreeMaker") }}
				</Uploader>
			</Dropdown>
			<HelpMenu />
		</div>

		<div class="btn-group me-2">
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

		<TabBar />

		<div class="btn-group" id="panelToggle">
			<button type="button" class="btn btn-primary" @click="toggle" :title="$t('toolbar.panel')"
					:disabled="!Studio.project">
				<i class="bp-sliders-h" />
			</button>
		</div>
	</nav>
</template>

<script lang="ts">
	export default { name: "Toolbar" };
</script>

<script setup lang="ts">

	import Studio from "app/services/studioService";
	import { hk } from "app/services/customHotkeyService";
	import FileUtil from "app/utils/fileUtility";
	import Dialogs from "app/services/dialogService";
	import { Dropdown } from "@/gadgets/menu";
	import { toggle } from "@/panel/panel.vue";
	import Uploader from "@/gadgets/file/uploader.vue";
	import TabBar from "./components/tabBar.vue";
	import FileMenu from "./fileMenu.vue";
	import SettingMenu from "./settingMenu.vue";
	import HelpMenu from "./helpMenu.vue";
	import EditMenu from "./editMenu.vue";

	function toLayout(): void {
		if(Studio.project) Studio.project.design.mode = "layout";
	}
	function toTree(): void {
		if(Studio.project) Studio.project.design.mode = "tree";
	}

	async function TreeMaker(file: File): Promise<void> {
		const content = FileUtil.bufferToText(await FileUtil.readFile(file));
		const name = file.name;
		console.log(name);
		try {
			//TODO
			// core.open(this.bp.TreeMaker.parse(name.replace(/\.tmd5$/i, ""), content));
		} catch(e) {
			if(e instanceof Error) Dialogs.alert(i18n.t(e.message, [name]));
		}
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
