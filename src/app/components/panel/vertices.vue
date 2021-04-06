<template>
	<div>
		<h5 v-t="'panel.vertices.type'" class="panel-title"></h5>
		<div v-if="selections.some(s=>s.degree==1)">
			<button class="btn btn-primary" v-if="design.vertices.size>3" @click="design.vertices.delete(selections)" v-t="'keyword.delete'"></button>
			<span v-else v-t="'message.min3vertex'"></span>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="design.vertices.toFlap(selections)" v-t="'panel.vertices.goto'"></button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Vertices extends BaseComponent {}
</script>
