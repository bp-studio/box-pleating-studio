<template >
	<div>
		<h5 v-t="'panel.edge.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<number :label="$t('panel.edge.length')" v-model.number="subject.length"></number>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="subject.split()" v-t="'panel.edge.split'"></button>
			<button class="btn btn-primary" v-if="subject.isRiver" @click="subject.deleteAndMerge()" v-t="'panel.edge.merge'"></button>
			<button class="btn btn-primary" v-else @click="bp.delete(subject)" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button
				class="btn btn-primary"
				@click="bp.goToDual(selection)"
			>{{subject.isRiver?$t('panel.edge.goto'):$t('panel.vertex.goto')}}</button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Edge extends BaseComponent {
		protected get subject(): BP.Edge { return this.selection as BP.Edge; }
	}
</script>
