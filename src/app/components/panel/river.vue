<template >
	<div>
		<h5 v-t="'panel.river.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<number :label="$t('panel.river.width')" v-model.number="subject.length" :min="0"></number>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.delete(subject)" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual(subject)" v-t="'panel.river.goto'"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import BP from '../import/BPStudio';

	@Component
	export default class River extends BaseComponent {
		protected get subject() { return this.selection as BP.River; }
	}
</script>
