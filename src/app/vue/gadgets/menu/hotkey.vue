<template>
	<div class="d-flex">
		<div class="flex-grow-1">
			<!-- Fully customized icon is possible with icon slot -->
			<slot name="icon" v-if="$slots.icon" />
			<i v-else :class="icon" :style="color !== undefined ? `color: ${toHex(color)}` : ''" />
			<slot></slot>
		</div>
		<div class="ms-3 text-end desktop-only">{{ key }}</div>
		<div v-if="touch" class="ms-4 text-end touch-only" style="margin-right:-1rem"><i :class="touch" /></div>
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import { isMac } from "app/shared/constants";
	import { toHex } from "shared/utils/color";

	defineOptions({ name: "Hotkey" });

	const props = defineProps<{
		icon?: string;
		color?: number;
		hk?: string;
		ctrl?: boolean;
		shift?: boolean;
		touch?: string;
	}>();

	const key = computed(() => {
		let result = props.hk;
		if(props.shift) result = (isMac ? "⇧" : "Shift+") + result;
		if(props.ctrl) result = (isMac ? "⌘" : "Ctrl+") + result;
		return result;
	});

</script>
