<template >
	<div>
		<h5 v-t="'panel.flaps.type'" class="panel-title"></h5>
		<div class="mt-3">
			<button class="btn btn-primary" v-if="!bp.isMinimal(design)" @click="bp.delete()" v-t="'keyword.delete'"></button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual()" v-t="'panel.flaps.goto'" :title="hk('n','d')"></button>
		</div>
	</div>
</template>


<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Flaps extends BaseComponent { }
</script>
