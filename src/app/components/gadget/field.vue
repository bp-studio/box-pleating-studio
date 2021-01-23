<template>
	<div class="row mb-2">
		<label class="col-form-label col-3">{{ label }}</label>
		<div class="col-9">
			<input
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
	import { Component, Prop } from 'vue-property-decorator';
	import InputMixin from '../mixins/inputMixin';

	@Component
	export default class Field extends InputMixin {
		@Prop(String) public label: string;
		@Prop(String) public type: string;
		@Prop(String) public placeholder: string;
	}
</script>
