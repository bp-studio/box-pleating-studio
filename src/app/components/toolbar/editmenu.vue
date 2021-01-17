<template>
	<dropdown icon="bp-pencil-ruler" :title="$t('toolbar.edit.title')">
		<div class="dropdown-item">
			<hotkey icon="bp-undo" hk="Ctrl+Z">{{$t('toolbar.edit.undo')}}</hotkey>
		</div>
		<div class="dropdown-item">
			<hotkey icon="bp-redo" hk="Ctrl+Y">{{$t('toolbar.edit.redo')}}</hotkey>
		</div>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import { bp } from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class EditMenu extends BaseComponent {
		mounted() {
			document.body.addEventListener("keydown", e => {
				// 如果正在使用輸入框，不處理一切後續
				let active = document.activeElement;
				if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
				if(e.ctrlKey) {
					event.preventDefault();
					if(e.key == "z") {}
					if(e.key == "y") {}
				}
			})
		}
	}
</script>
