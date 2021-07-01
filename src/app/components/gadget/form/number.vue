<template>
	<row :label="label">
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
	</row>
</template>

<script lang="ts">
	import { Component, Prop, Watch } from 'vue-property-decorator';
	import InputMixin from '../../mixins/inputMixin';

	@Component({ name: "number" })
	export default class NumberField extends InputMixin {
		@Prop(String) public label: string;

		@Prop(null) public min?: number;
		@Prop(null) public max?: number;
		@Prop(Number) public step: number = 1;

		private lastWheel: number = performance.now();
		private timeout: number = 0;

		@Watch("value") onValue(v: number): void {
			window.clearTimeout(this.timeout);
		}

		protected get canMinus(): boolean {
			return this.min === undefined || this.v > this.min;
		}
		protected get canPlus(): boolean {
			return this.max === undefined || this.v < this.max;
		}

		public input(event: InputEvent): void {
			let v = Number((event.target as HTMLInputElement).value);
			if(v < this.min || v > this.max) return;
			this.v = v;
			this.$emit('input', this.v);
		}

		public change(by: number): number {
			const CHANGE_DELAY = 50;
			// 這邊的計算起點採用 this.value 而非 this.v，
			// 以免高速的滾動導致結果錯誤
			let v = Math.round((this.value as number + by) / this.step) * this.step;
			if(v < this.min || v > this.max) return;
			this.timeout = window.setTimeout(() => this.v = this.value, CHANGE_DELAY);
			this.$emit('input', v);
			return this.v = v;
		}

		public wheel(event: WheelEvent): void {
			const DELTA_UNIT = 100, WHEEL_THROTTLE = 50;
			event.stopPropagation();
			event.preventDefault();

			// 做一個 throttle 以免過度觸發
			let now = performance.now();
			if(now - this.lastWheel < WHEEL_THROTTLE) return;
			this.lastWheel = now;

			let by = Math.round(-event.deltaY / DELTA_UNIT);
			this.change(by * this.step);
		}
	}
</script>
