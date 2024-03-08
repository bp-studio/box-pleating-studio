<template>
	<div v-if="!disabled" class="dropdown-item" @click="emit('click')" role="menuitem">
		<slot></slot>
	</div>
	<div v-else class="dropdown-item disabled" @click.stop role="menuitem">
		<slot></slot>
	</div>
</template>

<script setup lang="ts">

	defineOptions({ name: "DropdownItem" });

	const props = defineProps<{
		disabled?: boolean;
	}>();
	const emit = defineEmits(["click"]);

	function execute(): void {
		if(!props.disabled) emit("click");
	}

	defineExpose({ execute });

</script>

<style lang="scss">
	.dropdown-item:not(.disabled) {
		&:hover,
		&:active {
			color: #fff;
			text-decoration: none;
			background-color: var(--bs-primary);
			background-image: var(--bs-gradient);
		}
	}

	.dropdown-item:hover i {
		/* Disable all custom icon color on hover */
		color: unset !important;
	}
</style>
