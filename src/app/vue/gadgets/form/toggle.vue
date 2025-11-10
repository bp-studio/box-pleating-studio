<template>
	<div class="row mb-2 py-1">
		<div class="col">
			<div class="form-check form-switch">
				<input class="form-check-input" type="checkbox" :id="id" :checked="modelValue"
					@input="modelValue = isChecked($event.target)">
				<label class="form-check-label" v-bind:for="id">
					<slot />
				</label>
				<slot name="append" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { useId } from "vue";

	defineOptions({ name: "Toggle" });

	const id = `field${useId()}`;

	const modelValue = defineModel<boolean>({ required: true });

	function isChecked(target: unknown): boolean {
		return (target as HTMLInputElement).checked;
	}

</script>
