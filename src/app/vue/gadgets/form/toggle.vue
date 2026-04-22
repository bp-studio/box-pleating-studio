<template>
	<div class="row mb-2 py-1">
		<div class="col">
			<div class="form-check form-switch">
				<input
					:id="id"
					class="form-check-input"
					type="checkbox"
					:checked="modelValue"
					@input="modelValue = isChecked($event.target)"
				>
				<label class="form-check-label" :for="id">
					<slot/>
				</label>
				<slot name="append"/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { useId } from "vue";

	defineOptions({ name: "Toggle" });

	const modelValue = defineModel<boolean>({ required: true });

	const id = `field${useId()}`;

	function isChecked(target: unknown): boolean {
		return (target as HTMLInputElement).checked;
	}

</script>
