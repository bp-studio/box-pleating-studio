<template >
	<div>
		<h5 v-t="'panel.edge.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<number :label="$t('panel.edge.length')" v-model.number="subject.length"></number>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="subject.split()" v-t="'panel.edge.split'"></button>
			<button
				class="btn btn-primary"
				v-if="subject.isRiver"
				@click="subject.deleteAndMerge()"
				v-t="'panel.edge.merge'"
			></button>
			<button class="btn btn-primary" v-else @click="bp.delete(subject)" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button
				class="btn btn-primary"
				@click="bp.goToDual(selection)"
				v-t="subject.isRiver?'panel.edge.goto':'panel.vertex.goto'"
			></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import BP from '../import/BPStudio';

	@Component
	export default class Edge extends BaseComponent {
		protected get subject() { return this.selection as BP.Edge; }
	}
</script>
