<template>
	<div
		v-if="!disabled"
		class="dropdown-item"
		role="menuitem"
		@click="emit('click')"
	>
		<slot/>
	</div>
	<div
		v-else
		class="dropdown-item disabled"
		role="menuitem"
		@click.stop
	>
		<slot/>
	</div>
</template>

<script setup lang="ts">

	defineOptions({ name: "DropdownItem" });

	const props = defineProps<{
		disabled?: boolean;
	}>();
	const emit = defineEmits<{
		click: [];
	}>();

	function execute(): void {
		if(!props.disabled) emit("click");
	}

	defineExpose({ execute });

</script>
