<template >
	<div>
		<h5 v-t="'panel.flaps.type'" class="panel-title"></h5>
		<div class="mt-3">
			<button class="btn btn-primary" v-if="!design.tree.isMinimal" @click="design.flaps.delete(subject)" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual(selections)" v-t="'panel.flaps.goto'"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import BP from '../import/BPStudio';

	@Component
	export default class Flaps extends BaseComponent {
		protected get subject() { return this.selections as BP.Flap[]; }
	}
</script>
