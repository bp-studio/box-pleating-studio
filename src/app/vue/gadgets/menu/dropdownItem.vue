<template>
	<div v-if="!disabled" class="dropdown-item" @click="emit('click')">
		<slot></slot>
	</div>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	export default { name: "DropdownItem" };
</script>

<script setup lang="ts">

	defineProps({
		disabled: Boolean,
	});
	const emit = defineEmits(["click"]);

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
</style>
