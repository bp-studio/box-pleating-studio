<template>
	<Dropdown label="Tools" icon="bp-tools" :title="$t('toolbar.tools.title')">
		<DropdownItem :disabled="!Studio.project" @click="show('optimizer')">
			<i class="fa-solid fa-calculator"/>{{ $t("plugin.optimizer._") }}
		</DropdownItem>
		<DropdownItem :disabled="!Studio.project" @click="toggleHealth">
			<Hotkey icon="fas fa-stethoscope" ctrl hk="D">{{ healthEnabled ? $t("toolbar.tools.healthOff") : $t("toolbar.tools.health") }}</Hotkey>
		</DropdownItem>
		<Divider/>
		<Uploader accept=".tmd5" @upload="TreeMaker($event)">
			<i class="fas fa-file-import"/>{{ $t("toolbar.tools.TreeMaker") }}
		</Uploader>
		<DropdownItem :disabled="!Studio.project" @click="show('cp')">
			<i class="fas fa-file-export"/>{{ $t("plugin.CP._") }}
		</DropdownItem>
	</Dropdown>
</template>

<script setup lang="ts">

	import { computed, onMounted } from "vue";

	import { Dropdown } from "@/gadgets/menu";
	import DropdownItem from "@/gadgets/menu/dropdownItem.vue";
	import Hotkey from "@/gadgets/menu/hotkey.vue";
	import HotKeyService from "app/services/hotkeyService";
	import FileUtil from "app/utils/fileUtility";
	import Dialogs from "app/services/dialogService";
	import Studio from "app/services/studioService";
	import { Uploader } from "@/gadgets/file";
	import Workspace from "app/services/workspaceService";
	import { show } from "@/modals/modals";
	import Divider from "@/gadgets/menu/divider.vue";
	import SessionService from "app/services/sessionService";

	defineOptions({ name: "ToolMenu" });

	onMounted(() => {
		HotKeyService.register(() => {
			if(Studio.project) toggleHealth();
		}, "d");
	});

	const healthEnabled = computed(
		() => Boolean(Studio.project?.design.layout.health.enabled)
	);

	function toggleHealth(): void {
		const design = Studio.project!.design;
		const health = design.layout.health;
		health.enabled = !health.enabled;
		if(health.enabled) design.mode = "layout";
	}

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
