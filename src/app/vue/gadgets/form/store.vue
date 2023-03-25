<template>
	<row :label="label" v-if="size > 1">
		<div class="input-group">
			<button class="btn btn-sm btn-primary" type="button" @click="$emit('move', -1)">
				<i class="fas fa-arrow-left"></i>
			</button>
			<input class="form-control text-center" readonly type="text" :value="(index + 1) + ' / ' + size" />
			<button class="btn btn-sm btn-primary" type="button" @click="$emit('move', 1)">
				<i class="fas fa-arrow-right"></i>
			</button>
		</div>
	</row>
</template>

<script lang="ts">
	export default { name: "Store" };
</script>

<script setup lang="ts">
	import row from "./row.vue";

	defineProps<{
		size: number;
		index: number;
		label: string;
	}>();
	defineEmits(["move"]);
</script>
