<template>
	<div>
		<h5 v-t="'panel.river.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<number :label="$t('panel.river.width')" v-model.number="subject.length" :min="0" hotkeys="d.rd,d.ri"></number>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.delete()" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual()" v-t="'panel.river.goto'" :title="hk('n','d')"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class River extends BaseComponent {
		protected get subject(): BP.River { return this.selection as BP.River; }
	}
</script>
