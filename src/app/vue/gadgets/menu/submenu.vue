<template>
	<div class="dropdown-submenu" @mouseenter="enter" @mouseleave="leave">
		<div class="dropdown-item" @click.stop>
			<div class="float-end" style="margin-right: -1.25rem;">
				<i class="fas fa-caret-right" />
			</div>
			<i :class="icon" />{{ label }}
		</div>
		<div class="dropdown-menu" ref="sub">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { shallowRef } from "vue";

	defineOptions({ name: "SubMenu" });

	const sub = shallowRef<HTMLDivElement>();
	const SUBMENU_DELAY = 250;

	let timeout: number;

	defineProps<{
		icon: string;
		label: string;
	}>();

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
