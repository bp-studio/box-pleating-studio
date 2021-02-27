<template >
	<div>
		<h5 v-t="'panel.edge.type'" class="panel-title"></h5>
		<number :label="$t('panel.edge.length')" v-model.number="selection.length"></number>
		<div class="mt-3">
			<button class="btn btn-primary" @click="selection.split()" v-t="'panel.edge.split'"></button>
			<button
				class="btn btn-primary"
				v-if="selection.edge.isRiver"
				@click="selection.deleteAndMerge()"
				v-t="'panel.edge.merge'"
			></button>
			<button class="btn btn-primary" v-else @click="selection.delete()" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button
				class="btn btn-primary"
				@click="design.edgeToRiver(selection)"
				v-t="selection.edge.isRiver?'panel.edge.goto':'panel.vertex.goto'"
			></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Edge extends BaseComponent { }
</script>
