<template>
	<div :class="label?'row mb-2':''">
		<label class="col-form-label col-3" v-if="label">{{ label }}</label>
		<div :class="{'col-9':label}">
			<div class="input-group" style="flex-wrap:nowrap">
				<button class="btn btn-sm btn-primary" :disabled="!canMinus" type="button" @click="change(-step)">
					<i class="fas fa-minus"></i>
				</button>
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
					style="min-width:30px;"
				/>
				<button class="btn btn-sm btn-primary" :disabled="!canPlus" type="button" @click="change(step)">
					<i class="fas fa-plus"></i>
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop } from 'vue-property-decorator';
	import InputMixin from '../mixins/inputMixin';

	@Component({ name: "number" })
	export default class NumberField extends InputMixin {
		@Prop(String) public label: string;

		@Prop(null) public min?: number;
		@Prop(null) public max?: number;
		@Prop(Number) public step: number = 1;

		private lastWheel: number = performance.now();

		protected get canMinus() {
			return this.min === undefined || this.v > this.min;
		}
		protected get canPlus() {
			return this.max === undefined || this.v < this.max;
		}

		public input(event: InputEvent) {
			let v = Number((event.target as HTMLInputElement).value);
			if(v < this.min || v > this.max) return;
			this.v = v;
			this.$emit('input', this.v);
		}

		public change(by: number) {
			// 這邊的計算起點採用 this.value 而非 this.v，
			// 以免高速的滾動導致結果錯誤
			let v = Math.round((this.value + by) / this.step) * this.step;
			if(v < this.min || v > this.max) return;
			this.$emit('input', v);
			return this.v = v;
		}

		public wheel(event: WheelEvent) {
			event.stopPropagation();
			event.preventDefault();

			// 做一個 throttle 以免過度觸發
			let now = performance.now();
			if(now - this.lastWheel < 50) return;
			this.lastWheel = now;

			let by = Math.round(-event.deltaY / 100);
			this.change(by * this.step);
		}
	}
</script>
