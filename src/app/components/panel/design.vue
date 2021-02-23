<template>
	<div>
		<h5 v-t="'panel.design.type'"></h5>
		<field :label="$t('panel.design.title')" v-model="design.title" :placeholder="$t('panel.design.titlePH')"></field>
		<div class="mt-1 mb-4">
			<textarea class="form-control" v-model="design.description" rows="4" :placeholder="$t('panel.design.descriptionPH')"></textarea>
		</div>
		<div class="my-2">
			<h6 v-if="design.mode=='tree'" v-t="'panel.design.tree'"></h6>
			<h6 v-if="design.mode=='layout'" v-t="'panel.design.layout'"></h6>
		</div>
		<number :label="$t('panel.design.width')" v-model.number="design.sheet.width"></number>
		<number :label="$t('panel.design.height')" v-model.number="design.sheet.height"></number>
		<number :label="$t('panel.design.zoom')" :step="step" v-model.number="design.sheet.zoom"></number>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Design extends BaseComponent {
		private get step() {
			let s: number = this.design.sheet.zoom;
			return (2 ** Math.floor(Math.log2(s / 100))) * 25;
		}
	}
</script>
