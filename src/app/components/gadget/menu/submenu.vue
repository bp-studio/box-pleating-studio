<template>
	<div class="dropdown-submenu" @mouseenter="enter" @mouseleave="leave">
		<div class="dropdown-item" @click.stop>
			<div class="float-end" style="margin-right: -1.25rem;">
				<i class="fas fa-caret-right"></i>
			</div>
			<i :class="icon"></i>
			{{label}}
		</div>
		<div class="dropdown-menu" ref="sub">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	@Component
	export default class Submenu extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public label: string;

		private timeout: number;

		protected enter(): void {
			clearTimeout(this.timeout);
			(this.$refs.sub as HTMLDivElement).style.display = "block";
		}
		protected leave(): void {
			const SUBMENU_DELAY = 250;
			this.timeout = window.setTimeout(() => {
				(this.$refs.sub as HTMLDivElement).style.display = "none";
			}, SUBMENU_DELAY);
		}
	}
</script>

<style>
	.dropdown-submenu {
		position: relative;
	}
	.dropdown-submenu > .dropdown-menu {
		top: 0;
		left: calc(100% - 0.5rem);
		margin-top: -0.5rem;
	}
</style>
