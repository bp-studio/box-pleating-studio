<template>
	<div>
		<h5 v-t="'panel.vertex.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<field :label="$t('panel.vertex.name')" v-model="subject.name"></field>
		</div>
		<div class="mt-3 d-flex" style="flex-wrap: wrap;">
			<button class="btn btn-primary flex-shrink-0" @click="subject.addLeaf(newLength)" v-t="'panel.vertex.addLeaf'"></button>
			<div class="flex-grow-1 d-flex">
				<label
					class="col-form-label ms-2 text-end"
					style="width: 0; flex-grow: 1000; max-width: calc((100% - 230px * 0.98) * 50); overflow: hidden;"
				>...&nbsp;</label>
				<div class="d-flex flex-grow-1">
					<label class="col-form-label me-2 flex-shrink-0" v-t="'panel.vertex.ofLength'"></label>
					<div class="flex-grow-1" style="width: 90px;">
						<number v-model="newLength" :min="1"></number>
					</div>
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

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Vertex extends BaseComponent {
		protected newLength: number = 1;

		protected get subject(): BP.Vertex { return this.selection as BP.Vertex; }
	}
</script>
