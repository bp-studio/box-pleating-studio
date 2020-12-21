<template>
	<div class="input-group">
		<div class="input-group-prepend">
			<button class="btn btn-sm btn-primary" type="button" @click="change(-1)">
				<i class="fas fa-minus"></i>
			</button>
		</div>
		<input
			class="form-control"
			:class="{'error':v!=value}"
			type="number"
			v-model="v"
			@focus="focus($event)"
			@blur="blur"
			@input="input($event)"
			:min="min"
			:max="max"
			@wheel="wheel($event)"
		/>
		<div class="input-group-append">
			<button class="btn btn-sm btn-primary" type="button" @click="change(1)">
				<i class="fas fa-plus"></i>
			</button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Watch } from 'vue-property-decorator';
	import { Shrewd } from '../import/BPStudio';
	import InputMixin from '../mixins/inputMixin';

	@Component({ name: "number" })
	export default class NumberField extends InputMixin {
		@Watch('v') onVChange(checked: boolean) {
			if(this.type == 'checkbox') this.$emit('input', checked);
		}

		@Prop(String) public label: string;
		@Prop(String) public type: string;

		@Prop(null) public min?: number;
		@Prop(null) public max?: number;

		public input(event) {
			let v = Number(event.target.value);
			if(v < this.min || v > this.max) return;
			this.v = v;
			this.$emit('input', this.v);
		}
		public change(by) {
			if(this.v + by < this.min || this.v + by > this.max) return;
			this.$emit('input', this.v + by);
			return this.v + by;
		}
		public wheel(event) {
			event.stopPropagation();
			event.preventDefault();
			let by = Math.round(-event.deltaY / 100);
			this.v = this.change(by);
			Shrewd.commit();
		}
	}
</script>
