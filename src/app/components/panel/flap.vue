<template>
	<div v-if="design">
		<h5 v-t="'panel.flap.type'" class="panel-title"></h5>
		<div class="panel-grid">
			<field :label="$t('panel.flap.name')" v-model="subject.name"></field>
			<number :label="$t('panel.flap.radius')" v-model.number="subject.radius" :min="1" hotkeys="d.rd,d.ri"></number>
			<number
				:label="$t('panel.flap.width')"
				v-model.number="subject.width"
				:max="design.sheet.width"
				:min="0"
				hotkeys="d.wd,d.wi"
			></number>
			<number
				:label="$t('panel.flap.height')"
				v-model.number="subject.height"
				:max="design.sheet.height"
				:min="0"
				hotkeys="d.hd,d.hi"
			></number>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" v-if="!bp.isMinimal(design)" @click="bp.delete()" v-t="'keyword.delete'">Delete</button>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual()" v-t="'panel.flap.goto'" :title="hk('n','d')"></button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Flap extends BaseComponent {
		protected get subject(): BP.Flap { return this.selection as BP.Flap; }
	}
</script>
