<template>
	<div>
		<h5 v-t="'panel.vertex.type'"></h5>
		<field :label="$t('panel.vertex.name')" type="text" v-model="selection.name"></field>
		<div class="mt-3 d-flex">
			<div class="flex-shrink-0 me-2">
				<button class="btn btn-primary" @click="selection.addLeaf(newLength)" v-t="'panel.vertex.addLeaf'"></button>
				{{$t('panel.vertex.ofLength')}}
			</div>
			<div class="flex-grow-1">
				<number v-model="newLength" :min="1"></number>
			</div>
		</div>
		<div class="mt-3" v-if="design.tree.node.size>3">
			<button class="btn btn-primary" v-if="selection.degree==1" @click="selection.node.dispose()" v-t="'keyword.delete'"></button>
			<button
				class="btn btn-primary"
				v-if="selection.degree==2"
				@click="selection.deleteAndJoin()"
				v-t="'panel.vertex.delJoin'"
			></button>
		</div>
		<div class="mt-3" v-if="selection.degree==1">
			<button class="btn btn-primary" @click="design.vertexToFlap(selections)" v-t="'panel.vertex.goto'"></button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Watch } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Vertex extends BaseComponent {
		private newLength: number = 1;
	}
</script>
