<template>
	<div>
		<h5 v-t="'panel.flap.type'" class="panel-title"></h5>
		<field :label="$t('panel.flap.name')" v-model="selection.name"></field>
		<number :label="$t('panel.flap.radius')" v-model.number="selection.radius" :min="1"></number>
		<number :label="$t('panel.flap.width')" v-model.number="selection.width" :max="design.sheet.width" :min="0"></number>
		<number :label="$t('panel.flap.height')" v-model.number="selection.height" :max="design.sheet.height" :min="0"></number>
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
