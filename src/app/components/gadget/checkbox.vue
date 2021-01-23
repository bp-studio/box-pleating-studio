<template>
	<div class="row mb-2 py-1">
		<div class="col">
			<div class="form-check form-switch">
				<input class="form-check-input" type="checkbox" v-bind:id="id" v-model="v" />
				<label class="form-check-label" v-bind:for="id">{{label}}</label>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Watch } from 'vue-property-decorator';
	import InputMixin from '../mixins/inputMixin';

	@Component
	export default class Checkbox extends InputMixin {
		@Watch('v') onVChange(checked: boolean) {
			this.$emit('input', checked);
		}

		@Prop(String) public label: string;
	}
</script>
