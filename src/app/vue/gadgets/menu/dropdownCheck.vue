<template>
	<div class="dropdown-item" role="menuitemcheckbox" @click="toggle">
		<Hotkey :icon="modelValue ? icon : ''" :color="color" :ctrl="Boolean(hk)" :hk="hk">
			<slot />
		</Hotkey>
	</div>
</template>

<script setup lang="ts">
	import Hotkey from "./hotkey.vue";

	defineOptions({ name: "DropdownCheck" });

	const modelValue = defineModel<boolean>({ required: true });
	defineProps<{
		icon?: string;
		color?: number;
		hk?: string;
	}>();
	const emit = defineEmits<{
		click: [];
	}>();

	function toggle(): void {
		modelValue.value = !modelValue.value;
		emit("click");
	}

</script>
