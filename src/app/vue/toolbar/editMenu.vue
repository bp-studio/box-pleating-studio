<template>
	<Dropdown label="Edit" icon="bp-pencil-ruler" :title="$t('toolbar.edit.title')">
		<template v-slot>
			<DropdownItem :disabled="!Studio.history.canUndo" @click="undo">
				<Hotkey icon="bp-undo" ctrl hk="Z" touch="bp-2-finger">{{ $t('toolbar.edit.undo') }}</Hotkey>
			</DropdownItem>
			<DropdownItem :disabled="!Studio.history.canRedo" @click="redo">
				<Hotkey icon="bp-redo" ctrl hk="Y" touch="bp-3-finger">{{ $t('toolbar.edit.redo') }}</Hotkey>
			</DropdownItem>
			<Divider />
			<DropdownItem :disabled="!Studio.project" @click="Studio.project && Studio.project.design.sheet.subdivide()">
				<i class="fa-solid fa-table-cells"></i>{{ $t('toolbar.edit.subdivide') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.project && Studio.project.design.sheet.rotate(1)">
				<i class="fa-solid fa-rotate-right"></i>{{ $t('toolbar.edit.rotate_right') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.project && Studio.project.design.sheet.rotate(-1)">
				<i class="fa-solid fa-rotate-left"></i>{{ $t('toolbar.edit.rotate_left') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.project && Studio.project.design.sheet.flip(true)">
				<i class="fa-solid fa-arrows-left-right-to-line"></i>{{ $t('toolbar.edit.horizontal_flip') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.project && Studio.project.design.sheet.flip(false)">
				<i class="fa-solid fa-arrows-left-right-to-line fa-rotate-90"></i>{{ $t('toolbar.edit.vertical_flip') }}
			</DropdownItem>
			<Divider />
			<DropdownItem :disabled="!Studio.project" @click="selectAll">
				<Hotkey icon="fa-solid fa-border-all" ctrl hk="A">{{ $t('toolbar.edit.selectAll') }}</Hotkey>
			</DropdownItem>
			<DropdownItem :disabled="!Studio.selections.length" @click="unselectAll">
				<Hotkey icon="fas fa-border-none" :hk="isMac ? '⎋' : 'Esc'">{{ $t('toolbar.edit.unselectAll') }}</Hotkey>
			</DropdownItem>
		</template>
	</Dropdown>
</template>

<script setup lang="ts">

	import { onMounted } from "vue";

	import { Divider, Dropdown, DropdownItem, Hotkey } from "@/gadgets/menu";
	import HotkeyService from "app/services/hotkeyService";
	import { isMac } from "app/shared/constants";
	import Studio from "app/services/studioService";

	defineOptions({ name: "EditMenu" });

	onMounted(() => {
		HotkeyService.register(undo, "z");
		HotkeyService.register(redo, "y");
		HotkeyService.register(redo, "z", true, true);
		HotkeyService.register(selectAll, "a");
		HotkeyService.register(unselectAll, "escape", false);
		HotkeyService.register(Studio.del, "delete", false);
		HotkeyService.register(Studio.del, "backspace", false);

		// on certain keyboards
		HotkeyService.register(undo, "undo", false);
		HotkeyService.register(redo, "redo", false);
		HotkeyService.register(unselectAll, "clear", false);
	});

	function undo(): void {
		Studio.history.undo();
	}
	function redo(): void {
		Studio.history.redo();
	}
	function selectAll(): void {
		Studio.selectAll();
	}
	function unselectAll(): void {
		Studio.unselectAll();
	}

</script>
