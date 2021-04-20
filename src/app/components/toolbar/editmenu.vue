<template>
	<dropdown icon="bp-pencil-ruler" :title="$t('toolbar.edit.title')">
		<dropdownitem :disabled="!canUndo" @click="undo">
			<hotkey icon="bp-undo" ctrl hk="Z">{{$t('toolbar.edit.undo')}}</hotkey>
		</dropdownitem>
		<dropdownitem :disabled="!canRedo" @click="redo">
			<hotkey icon="bp-redo" ctrl hk="Y">{{$t('toolbar.edit.redo')}}</hotkey>
		</dropdownitem>
		<divider></divider>
		<dropdownitem :disabled="!design" @click="selectAll">
			<hotkey icon="fas fa-th" ctrl hk="A">{{$t('toolbar.edit.selectAll')}}</hotkey>
		</dropdownitem>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import { registerHotkey } from '../import/types';
	import { bp } from '../import/BPStudio';

	import { core } from '../core.vue';

	@Component
	export default class EditMenu extends BaseComponent {
		mounted() {
			registerHotkey(() => this.undo(), "z");
			registerHotkey(() => this.redo(), "y");
			registerHotkey(() => this.redo(), "z", true);
			registerHotkey(() => this.selectAll(), "a");
		}

		protected get canUndo() { return core.initialized && bp.canUndo(this.design); }
		protected get canRedo() { return core.initialized && bp.canRedo(this.design); }
		protected undo() { bp.undo(this.design); }
		protected redo() { bp.redo(this.design); }

		private selectAll() {
			if(this.design) this.design.selectAll();
		}
	}
</script>
