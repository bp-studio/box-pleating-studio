<template>
	<div v-if="!disabled" class="dropdown-item" @click="click">
		<slot></slot>
	</div>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	const CLICK_DELAY = 50;
	export default { name: "DropdownItem" };
</script>

<script setup lang="ts">

	const props = defineProps({
		disabled: Boolean,
		delay: Boolean,
	});
	const emit = defineEmits(["click"]);

	function click(): void {
		// 延遲觸發，以免當事件 handler 為 long task 的時候看不到點擊回饋
		setTimeout(() => emit("click"), props.delay ? CLICK_DELAY : 0);
	}

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
