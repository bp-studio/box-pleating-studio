<template>
	<div>
		<h5 v-t="'panel.vertex.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<field :label="$t('panel.vertex.name')" v-model="selection.name"></field>
		</div>
		<div class="mt-3 d-flex" style="flex-wrap:wrap;">
			<button class="btn btn-primary flex-shrink-0" @click="selection.addLeaf(newLength)" v-t="'panel.vertex.addLeaf'"></button>
			<div class="flex-grow-1 d-flex justify-content-end" style="flex-basis:150px; width:0px;">
				<label class="col-form-label ms-2 flex-shrink-0" style="max-width:calc(100% - 200px); overflow:hidden;">
					...&nbsp;
				</label>
				<label class="col-form-label me-2 flex-shrink-0" v-t="'panel.vertex.ofLength'"></label>
				<div class="flex-grow-1" style="max-width:calc(200px - 50%)">
					<number v-model="newLength" :min="1"></number>
				</div>
			</div>
		</div>
		<div class="mt-3" v-if="design.tree.node.size>3">
			<button class="btn btn-primary" v-if="selection.degree==1" @click="selection.delete()" v-t="'keyword.delete'"></button>
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
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Vertex extends BaseComponent {
		private newLength: number = 1;
	}
</script>
