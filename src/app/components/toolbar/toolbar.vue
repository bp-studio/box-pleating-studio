<template>
	<div id="divToolbar" class="btn-toolbar p-2">
		<div class="btn-group me-2">
			<filemenu @share="$emit('share')"></filemenu>
			<editmenu></editmenu>
			<settingmenu @pref="$emit('pref')"></settingmenu>
			<dropdown icon="bp-tools" :title="$t('toolbar.tools.title')">
				<uploader accept=".tmd5" @upload="TreeMaker($event)">
					<i class="fas fa-file-import"></i>
					{{$t("toolbar.tools.TreeMaker")}}
				</uploader>
			</dropdown>
			<helpmenu @about="$emit('about')" @news="$emit('news')"></helpmenu>
		</div>

		<div class="btn-group me-2">
			<button
				type="button"
				class="btn btn-primary"
				:class="{active:design&&design.mode=='tree'}"
				@click="toTree"
				:title="$t('toolbar.view.tree')"
				:disabled="!design"
			>
				<i class="bp-tree"></i>
			</button>
			<button
				type="button"
				class="btn btn-primary"
				:class="{active:design&&design.mode=='layout'}"
				@click="toLayout"
				:title="$t('toolbar.view.layout')"
				:disabled="!design"
			>
				<i class="bp-layout"></i>
			</button>
		</div>

		<tabs></tabs>

		<div class="btn-group" id="panelToggle">
			<button
				type="button"
				class="btn btn-primary"
				@click="$emit('panel')"
				:title="$t('toolbar.panel')"
				:disabled="!design"
			>
				<i class="bp-sliders-h"></i>
			</button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Toolbar extends BaseComponent {

		public toLayout() { this.design.mode = "layout"; }
		public toTree() { this.design.mode = "tree"; }

		public async TreeMaker(event: Event) {
			let f = event.target as HTMLInputElement;
			if(f.files.length == 0) return;
			let content = bufferToText(await readFile(f.files[0]));
			let name = f.files[0].name;
			try {
				core.open(this.bp.TreeMaker.parse(name.replace(/\.tmd5$/i, ""), content));
			} catch(e) {
				core.alert(this.$t(e.message, [name]));
			}
			f.value = "";
		}
	}
</script>
