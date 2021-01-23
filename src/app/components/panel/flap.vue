<template>
	<div>
		<h5 v-t="'panel.flap.type'"></h5>
		<field :label="$t('panel.flap.name')" type="text" v-model="selection.name"></field>
		<number :label="$t('panel.flap.radius')" v-model.number="selection.radius"></number>
		<number :label="$t('panel.flap.width')" v-model.number="selection.width" :max="design.sheet.width"></number>
		<number :label="$t('panel.flap.height')" v-model.number="selection.height" :max="design.sheet.height"></number>
		<div class="mt-3">
			<button
				class="btn btn-primary"
				v-if="design.tree.node.size>3"
				@click="design.deleteFlaps(selections)"
				v-t="'keyword.delete'"
			>Delete</button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="design.flapToVertex(selections)" v-t="'panel.flap.goto'"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Flap extends BaseComponent { }
</script>
