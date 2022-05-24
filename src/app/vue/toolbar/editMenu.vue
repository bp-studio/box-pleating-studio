<template>
	<Dropdown icon="bp-pencil-ruler" :title="$t('toolbar.edit.title')">
		<template v-slot>
			<DropdownItem :disabled="!Studio.history.canUndo" @click="undo">
				<Hotkey icon="bp-undo" ctrl hk="Z">{{ $t('toolbar.edit.undo') }}</Hotkey>
			</DropdownItem>
			<DropdownItem :disabled="!Studio.history.canRedo" @click="redo">
				<Hotkey icon="bp-redo" ctrl hk="Y">{{ $t('toolbar.edit.redo') }}</Hotkey>
			</DropdownItem>
			<Divider />
			<DropdownItem :disabled="!Studio.project" @click="selectAll">
				<Hotkey icon="fas fa-th" ctrl hk="A">{{ $t('toolbar.edit.selectAll') }}</Hotkey>
			</DropdownItem>
			<DropdownItem :disabled="!selection" @click="unselectAll">
				<Hotkey icon="fas fa-border-none" :hk="isMac ? '⎋' : 'Esc'">{{ $t('toolbar.edit.unselectAll') }}</Hotkey>
			</DropdownItem>
		</template>
	</Dropdown>
</template>

<script lang="ts">
	export default { name: "EditMenu" };
</script>

<script setup lang="ts">

	import { onMounted } from "vue";

	import { Divider, Dropdown, DropdownItem, Hotkey } from "@/gadgets/menu";
	import HotkeyService from "app/services/hotkeyService";
	import { isMac } from "app/shared/constants";
	import Studio from "app/services/studioService";

	onMounted(() => {
		HotkeyService.register(undo, "z");
		HotkeyService.register(redo, "y");
		HotkeyService.register(redo, "z", true);
		HotkeyService.register(selectAll, "a");
		HotkeyService.register(unselectAll, "escape");
	});

	const selection = Studio.selection;

	function undo(): void {
		Studio.history.undo();
	}
	function redo(): void {
		Studio.history.redo();
	}
	function selectAll(): void {
		// if(Studio.design) this.design.selectAll();
	}
	function unselectAll(): void {
		// if(Studio.design) this.design.unselectAll();
	}

</script>
