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
		<div ref="menu" class="dropdown-menu" @touchstartout="hide" @mousedownout="hide">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { core } from '../core.vue';
	import { dropdown } from '../import/types';
	import * as bootstrap from 'bootstrap';

	@Component
	export default class Dropdown extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public title: string;
		@Prop(Boolean) public notify: boolean;

		private dropdown: bootstrap.Dropdown;

		mounted() {
			core.libReady.then(() => this.dropdown = new bootstrap.Dropdown(this.$refs.btn as Element, {}));
			this.$el.addEventListener('show.bs.dropdown', () => this.$emit('show'));
			this.$el.addEventListener('shown.bs.dropdown', () => dropdown.current = this);
			this.$el.addEventListener('hide.bs.dropdown', () => {
				if(!dropdown.skipped) dropdown.current = null;
				dropdown.skipped = false;
			});
			this.$el.addEventListener('hidden.bs.dropdown', () => this.$emit('hide'));
		}

		protected get ready() { return core.initialized; }

		protected async hide() {
			await core.libReady;
			this.dropdown.hide();
		}

		protected mouseenter() {
			if(dropdown.current && dropdown.current != this) {
				dropdown.skipped = true;
				(this.$refs.btn as HTMLButtonElement).click();
			}
		}
	}
</script>
