<template>
	<div class="dropdown-item" role="menuitemcheckbox" @click="toggle">
		<Hotkey :icon="modelValue ? icon : ''" :color="color" :ctrl="Boolean(hk)" :hk="hk">
			<slot/>
		</Hotkey>
	</div>
</template>

<script setup lang="ts">
	import Hotkey from "./hotkey.vue";

	defineOptions({ name: "DropdownCheck" });

	const props = defineProps<{
		icon?: string;
		color?: number;
		hk?: string;
		modelValue: boolean;
	}>();
	const emit = defineEmits(["click", "update:modelValue"]);

	function toggle(): void {
		emit("update:modelValue", !props.modelValue);
		emit("click");
	}

</script>
