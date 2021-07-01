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

	@Component
	export default class EditMenu extends BaseComponent {
		mounted(): void {
			registerHotkey(() => this.undo(), "z");
			registerHotkey(() => this.redo(), "y");
			registerHotkey(() => this.redo(), "z", true);
			registerHotkey(() => this.selectAll(), "a");
		}

		protected get canUndo(): boolean {
			return core.initialized ? this.bp.canUndo(this.design) : false;
		}
		protected get canRedo(): boolean {
			return core.initialized ? this.bp.canRedo(this.design) : false;
		}
		protected undo(): void { this.bp.undo(this.design); }
		protected redo(): void { this.bp.redo(this.design); }

		private selectAll() {
			if(this.design) this.design.selectAll();
		}
	}
</script>
