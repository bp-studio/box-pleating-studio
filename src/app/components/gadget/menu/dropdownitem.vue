<template>
	<div v-if="!disabled" class="dropdown-item" @click="click">
		<slot></slot>
	</div>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	@Component
	export default class DropdownItem extends Vue {
		@Prop(Boolean) public disabled: boolean;
		@Prop(Boolean) public delay: boolean;

		protected click(): void {
			const CLICK_DELAY = 50;
			// 延遲觸發，以免當事件 handler 為 long task 的時候看不到點擊回饋
			setTimeout(() => this.$emit('click'), this.delay ? CLICK_DELAY : 0);
		}
	}
</script>

<style>
	.dropdown-item:hover:not(.disabled),
	.dropdown-item:active:not(.disabled) {
		color: #fff;
		text-decoration: none;
		background-color: var(--bs-primary);
		background-image: var(--bs-gradient);
	}
</style>
