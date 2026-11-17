<template>
	<template v-if="label">
		<div :id="labelId" class="col-form-label">{{ label }}</div>
		<div>
			<slot :label-id="labelId"/>
		</div>
	</template>
	<div v-else style="grid-column-end: span 2;">
		<slot/>
	</div>
</template>

<script setup lang="ts">

	import { useId } from "vue";

	defineOptions({ name: "Row" });

	defineProps<{
		label?: string;
	}>();

	defineSlots<{
		/** `labelId` is given only when there's a label. */
		default(props: { labelId?: string }): unknown;
	}>();

	/**
	 * The id of the label, for the form control in the slot to refer to by
	 * `aria-labelledby`, as the label isn't a `<label>` element.
	 */
	const labelId = useId();

</script>
