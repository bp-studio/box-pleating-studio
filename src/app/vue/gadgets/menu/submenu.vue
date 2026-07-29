<template>
	<div class="dropdown-submenu" @mouseenter="enter" @mouseleave="leave">
		<div class="dropdown-item" @click.stop>
			<div class="float-end" style="margin-right: -1.25rem;">
				<i class="fas fa-caret-right"/>
			</div>
			<i :class="icon"/>{{ label }}
		</div>
		<div ref="sub" class="dropdown-menu">
			<slot/>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { useTemplateRef } from "vue";

	defineOptions({ name: "SubMenu" });

	defineProps<{
		icon: string;
		label: string;
	}>();

	const sub = useTemplateRef("sub");
	const SUBMENU_DELAY = 250;

	let timeout: number;

	function enter(): void {
		clearTimeout(timeout);
		sub.value!.style.display = "block";
	}
	function leave(): void {
		timeout = setTimeout(() => {
			sub.value!.style.display = "none";
		}, SUBMENU_DELAY);
	}

</script>
