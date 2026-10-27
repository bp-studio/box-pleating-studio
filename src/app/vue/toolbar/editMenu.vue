<template>
	<Dropdown label="Edit" icon="bp-pencil-ruler" :title="$t('toolbar.edit.title')">
		<template #default>
			<DropdownItem :disabled="!Studio.history.canUndo" @click="menu('undo')">
				<Hotkey
					icon="bp-undo"
					ctrl
					hk="Z"
					touch="bp-2-finger"
				>
					{{ $t('toolbar.edit.undo') }}
				</Hotkey>
			</DropdownItem>
			<DropdownItem :disabled="!Studio.history.canRedo" @click="menu('redo')">
				<Hotkey
					icon="bp-redo"
					ctrl
					hk="Y"
					touch="bp-3-finger"
				>
					{{ $t('toolbar.edit.redo') }}
				</Hotkey>
			</DropdownItem>
			<template v-if="Studio.project?.design.mode != 'layout'">
				<Divider/>
				<DropdownItem :disabled="!Studio.project?.design.canCopy" @click="menu('cut')">
					<Hotkey icon="fa-solid fa-scissors" ctrl hk="X">{{ $t('toolbar.edit.cut') }}</Hotkey>
				</DropdownItem>
				<DropdownItem :disabled="!Studio.project?.design.canCopy" @click="menu('copy')">
					<Hotkey icon="fa-solid fa-copy" ctrl hk="C">{{ $t('toolbar.edit.copy') }}</Hotkey>
				</DropdownItem>
				<DropdownItem :disabled="!Studio.project?.design.canPaste" @click="menu('paste')">
					<Hotkey icon="fa-solid fa-paste" ctrl hk="V">{{ $t('toolbar.edit.paste') }}</Hotkey>
				</DropdownItem>
			</template>
			<Divider/>
			<DropdownItem
				:disabled="!Studio.project || !Studio.project.design.sheet.canSubdivide()"
				@click="Studio.project && Studio.project.design.sheet.subdivide()"
			>
				<i class="fa-solid fa-table-cells"/>{{ $t('toolbar.edit.subdivide') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.rotate(1)">
				<i class="fa-solid fa-rotate-right"/>{{ $t('toolbar.edit.rotate_right') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.rotate(-1)">
				<i class="fa-solid fa-rotate-left"/>{{ $t('toolbar.edit.rotate_left') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.flip(true)">
				<i class="fa-solid fa-arrows-left-right-to-line"/>{{ $t('toolbar.edit.horizontal_flip') }}
			</DropdownItem>
			<DropdownItem :disabled="!Studio.project" @click="Studio.flip(false)">
				<i class="fa-solid fa-arrows-left-right-to-line fa-rotate-90"/>{{ $t('toolbar.edit.vertical_flip') }}
			</DropdownItem>
			<Divider/>
			<DropdownItem :disabled="!Studio.project" @click="menu('selectAll')">
				<Hotkey icon="fa-solid fa-border-all" ctrl hk="A">{{ $t('toolbar.edit.selectAll') }}</Hotkey>
			</DropdownItem>
			<DropdownItem :disabled="!Studio.selections.length" @click="menu('unselectAll')">
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
	import Analytics from "app/services/analyticsService";

	defineOptions({ name: "EditMenu" });

	const commands = {
		undo: () => Studio.history.undo(),
		redo: () => Studio.history.redo(),
		selectAll: () => Studio.selectAll(),
		unselectAll: () => Studio.unselectAll(),
		delete: () => Studio.del(),
		cut: () => Studio.cut(),
		copy: () => Studio.copy(),
		paste: () => Studio.paste(),
	};

	type CommandName = keyof typeof commands;

	/** Run a command, recording the input method. */
	function run(name: CommandName, method: string): void {
		Analytics.input(name, method);
		commands[name]();
	}

	const menu = (name: CommandName): void => run(name, "menu");
	const key = (name: CommandName) => (): void => run(name, "key");

	onMounted(() => {
		HotkeyService.register(key("undo"), "z");
		HotkeyService.register(key("redo"), "y");
		HotkeyService.register(key("redo"), "z", true, true);
		HotkeyService.register(key("selectAll"), "a");
		HotkeyService.register(key("unselectAll"), "escape", false);
		HotkeyService.register(key("delete"), "delete", false);
		HotkeyService.register(key("delete"), "backspace", false);
		HotkeyService.register(key("cut"), "x");
		HotkeyService.register(key("copy"), "c");
		HotkeyService.register(key("paste"), "v");

		// on certain keyboards
		HotkeyService.register(key("undo"), "undo", false);
		HotkeyService.register(key("redo"), "redo", false);
		HotkeyService.register(key("unselectAll"), "clear", false);
	});

</script>
