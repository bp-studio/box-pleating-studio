<template>
	<row :label="label" v-if="size > 1">
		<div class="input-group">
			<button class="btn btn-sm btn-primary" type="button" @click="$emit('move', -1)">
				<i class="fas fa-arrow-left"></i>
			</button>
			<input class="form-control text-center" readonly type="text" :value="(index + 1) + ' / ' + size"
				   @wheel.passive="wheel($event)" style="cursor: ew-resize;" />
			<button class="btn btn-sm btn-primary" type="button" @click="$emit('move', 1)">
				<i class="fas fa-arrow-right"></i>
			</button>
		</div>
	</row>
</template>

<script setup lang="ts">

	import row from "./row.vue";
	import { useWheel } from "./useWheel";

	defineOptions({ name: "Store" });

	defineProps<{
		size: number;
		index: number;
		label: string;
	}>();
	const emit = defineEmits(["move"]);

	const wheel = useWheel(by => emit("move", by));

</script>
