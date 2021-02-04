<template>
	<dropdown icon="bp-pencil-ruler" :title="$t('toolbar.edit.title')">
		<dropdownitem :disabled="!design||!design.history.canUndo" @click="undo">
			<hotkey icon="bp-undo" ctrl hk="Z">{{$t('toolbar.edit.undo')}}</hotkey>
		</dropdownitem>
		<dropdownitem :disabled="!design||!design.history.canRedo" @click="redo">
			<hotkey icon="bp-redo" ctrl hk="Y">{{$t('toolbar.edit.redo')}}</hotkey>
		</dropdownitem>
		<divider></divider>
		<dropdownitem :disabled="!design" @click="selectAll">
			<hotkey icon="far fa-object-group" ctrl hk="A">{{$t('toolbar.edit.selectAll')}}</hotkey>
		</dropdownitem>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import { registerHotkey } from '../import/types';

	@Component
	export default class EditMenu extends BaseComponent {
		mounted() {
			registerHotkey(() => this.undo(), "z");
			registerHotkey(() => this.redo(), "y");
			registerHotkey(() => this.redo(), "z", true);
			registerHotkey(() => this.selectAll(), "a");
		}

		private undo() {
			this.design?.history.undo();
		}

		private redo() {
			this.design?.history.redo();
		}

		private selectAll() {
			this.design?.selectAll();
		}
	}
</script>
