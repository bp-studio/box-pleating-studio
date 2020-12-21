<template>
	<div class="form-row" v-if="type == 'checkbox'">
		<div class="col">
			<div class="custom-control custom-checkbox">
				<input class="custom-control-input" type="checkbox" v-bind:id="id" v-model="v" />
				<label class="custom-control-label" v-bind:for="id">{{label}}</label>
			</div>
		</div>
	</div>
	<div class="form-row mb-1" v-else>
		<label class="col-form-label col-3">{{ label }}</label>
		<div class="col-9">
			<number v-if="type=='number'" :value="v" @input="$emit('input', $event)"></number>
			<input
				v-else
				v-model="v"
				class="form-control"
				:placeholder="placeholder"
				:class="{ error: v != value }"
				:type="type"
				@focus="focus($event)"
				@blur="blur"
				@input="input($event)"
			/>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Watch } from 'vue-property-decorator';
	import InputMixin from '../mixins/inputMixin';

	declare var vid: number;

	@Component
	export default class Field extends InputMixin {
		@Watch('v') onVChange(checked: boolean) {
			if(this.type == 'checkbox') this.$emit('input', checked);
		}

		@Prop(String) public label: string;
		@Prop(String) public type: string;
		@Prop(String) public placeholder: string;
	}
</script>
