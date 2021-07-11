<template>
	<div class="btn-group">
		<button
			ref="btn"
			type="button"
			@mouseenter="mouseenter"
			:title="title"
			:disabled="!ready"
			class="btn btn-primary dropdown-toggle"
			data-bs-toggle="dropdown"
		>
			<i :class="icon"></i>
			<div class="notify" v-if="notify"></div>
		</button>
		<div ref="menu" class="dropdown-menu">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	import * as bootstrap from 'bootstrap';

	@Component
	export default class Dropdown extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public title: string;
		@Prop(Boolean) public notify: boolean;

		mounted(): void {
			libReady.then(() => {
				let dd = new bootstrap.Dropdown(this.$refs.btn as Element, {});

				// Bootstrap doesn't support touch cancel
				document.addEventListener('touchstart', event => {
					if(!(this.$refs.menu as Element).contains(event.target as Element)) dd.hide();
				}, { capture: true, passive: true });
			});

			this.$el.addEventListener('show.bs.dropdown', () => this.$emit('show'));
			this.$el.addEventListener('shown.bs.dropdown', () => dropdown.current = this);
			this.$el.addEventListener('hide.bs.dropdown', () => {
				if(!dropdown.skipped) dropdown.current = null;
				dropdown.skipped = false;
			});
			this.$el.addEventListener('hidden.bs.dropdown', () => this.$emit('hide'));
		}

		protected get ready(): boolean { return core.initialized; }

		protected mouseenter(): void {
			if(dropdown.current && dropdown.current != this) {
				dropdown.skipped = true;
				(this.$refs.btn as HTMLButtonElement).click();
			}
		}
	}
</script>
