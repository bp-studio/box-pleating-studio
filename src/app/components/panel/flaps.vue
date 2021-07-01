<template >
	<div>
		<h5 v-t="'panel.flaps.type'" class="panel-title"></h5>
		<div class="mt-3">
			<button class="btn btn-primary" v-if="!bp.isMinimal(design)" @click="bp.delete(subject)" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual(selections)" v-t="'panel.flaps.goto'"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Flaps extends BaseComponent {
		protected get subject(): BP.Flap[] { return this.selections as BP.Flap[]; }
	}
</script>
