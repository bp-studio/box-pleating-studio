<template>
	<Dropdown label="Tools" icon="bp-tools" :title="$t('toolbar.tools.title')">
		<DropdownItem :disabled="!Studio.project" @click="show('optimizer')">
			<i class="fa-solid fa-calculator"></i>
			{{ $t("plugin.optimizer._") }}
		</DropdownItem>
		<Divider />
		<Uploader accept=".tmd5" @upload="TreeMaker($event)">
			<i class="fas fa-file-import" />
			{{ $t("toolbar.tools.TreeMaker") }}
		</Uploader>
		<DropdownItem :disabled="!Studio.project" @click="show('cp')">
			<i class="fas fa-file-export" />
			{{ $t("plugin.CP._") }}
		</DropdownItem>
	</Dropdown>
</template>

<script setup lang="ts">

	import { Dropdown } from "@/gadgets/menu";
	import DropdownItem from "@/gadgets/menu/dropdownItem.vue";
	import FileUtil from "app/utils/fileUtility";
	import Dialogs from "app/services/dialogService";
	import Studio from "app/services/studioService";
	import { Uploader } from "@/gadgets/file";
	import Workspace from "app/services/workspaceService";
	import { show } from "@/modals/modals";
	import Divider from "@/gadgets/menu/divider.vue";
	import SessionService from "app/services/sessionService";

	defineOptions({ name: "ToolMenu" });

	async function TreeMaker(files: File[]): Promise<void> {
		const takeover = Studio.shouldTakeOverContextHandling();
		const file = files[0];
		const content = FileUtil.bufferToText(await FileUtil.readFile(file));
		const name = file.name;
		let index: number | undefined;
		try {
			const project = Studio.plugins.treeMaker(name.replace(/\.tmd5$/i, ""), content);
			await Workspace.open(project as Pseudo<typeof project>);
			Workspace.selectLast();
			index = Workspace.ids.value.length - 1;
		} catch(e) {
			if(e instanceof Error) Dialogs.alert(i18n.t(e.message, [name]));
		} finally {
			// Handling context loss
			if(takeover) {
				await SessionService.save(index);
				location.reload();
			}
		}
	}

</script>
