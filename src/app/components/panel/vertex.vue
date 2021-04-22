<template>
	<div>
		<h5 v-t="'panel.vertex.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<field :label="$t('panel.vertex.name')" v-model="subject.name"></field>
		</div>
		<div class="mt-3 d-flex" style="flex-wrap:wrap;">
			<button class="btn btn-primary flex-shrink-0" @click="subject.addLeaf(newLength)" v-t="'panel.vertex.addLeaf'"></button>
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
		<div class="mt-3" v-if="!bp.isMinimal(design)">
			<button class="btn btn-primary" v-if="subject.degree==1" @click="bp.delete(subject)" v-t="'keyword.delete'"></button>
			<button
				class="btn btn-primary"
				v-if="subject.degree==2"
				@click="subject.deleteAndJoin()"
				v-t="'panel.vertex.delJoin'"
			></button>
		</div>
		<div class="mt-3" v-if="subject.degree==1">
			<button class="btn btn-primary" @click="bp.goToDual(selections)" v-t="'panel.vertex.goto'"></button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import BP from '../import/BPStudio';

	@Component
	export default class Vertex extends BaseComponent {
		protected newLength: number = 1;

		protected get subject() { return this.selection as BP.Vertex; }
	}
</script>
