<template>
	<div class="d-flex">
		<div class="flex-grow-1">
			<i :class="icon" />
			<slot></slot>
		</div>
		<div class="ms-3 text-end desktop-only">{{ key }}</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Hotkey" };
</script>

<script setup lang="ts">

	import { computed } from "vue";

	import { isMac } from "app/shared/constants";

	const props = defineProps<{
		icon: string;
		hk?: string;
		ctrl?: boolean;
		shift?: boolean;
	}>();

	const key = computed(() => {
		let result = props.hk;
		if(props.shift) result = (isMac ? "⇧" : "Shift+") + result;
		if(props.ctrl) result = (isMac ? "⌘" : "Ctrl+") + result;
		return result;
	});

</script>
