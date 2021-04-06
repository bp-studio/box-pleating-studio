<template >
	<div>
		<h5 v-t="'panel.river.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<number :label="$t('panel.river.width')" v-model.number="selection.length" :min="0"></number>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="selection.delete()" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="design.rivers.toEdge(selection)" v-t="'panel.river.goto'"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class River extends BaseComponent { }
</script>
