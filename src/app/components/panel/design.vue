<template>
	<div v-if="design">
		<h5 v-t="'panel.design.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<field :label="$t('panel.design.title')" v-model="design.title" :placeholder="$t('panel.design.titlePH')"></field>
			<row>
				<div class="mt-1 mb-4">
					<textarea
						class="form-control"
						v-model="design.description"
						rows="4"
						:placeholder="$t('panel.design.descriptionPH')"
					></textarea>
				</div>
				<div class="my-2">
					<h6 v-if="design.mode=='tree'" v-t="'panel.design.tree'"></h6>
					<h6 v-if="design.mode=='layout'" v-t="'panel.design.layout'"></h6>
				</div>
			</row>
			<number :label="$t('panel.design.width')" v-model.number="design.sheet.width" :min="8"></number>
			<number :label="$t('panel.design.height')" v-model.number="design.sheet.height" :min="8"></number>
			<number :label="$t('panel.design.zoom')" :step="step" v-model.number="design.sheet.zoom" :min="100"></number>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Design extends BaseComponent {
		protected get step(): number {
			return zoomStep(this.design!.sheet.zoom);
		}
	}
</script>
