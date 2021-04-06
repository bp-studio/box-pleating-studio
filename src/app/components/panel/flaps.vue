<template >
	<div>
		<h5 v-t="'panel.flaps.type'" class="panel-title"></h5>
		<div class="mt-3">
			<button class="btn btn-primary" v-if="design.tree.node.size>3" @click="design.flaps.delete(selections)" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="design.flaps.toVertex(selections)" v-t="'panel.flaps.goto'"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Flaps extends BaseComponent { }
</script>
