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
	import * as bootstrap from 'bootstrap';

	@Component
	export default class Dropdown extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public title: string;
		@Prop(Boolean) public notify: boolean;

		private dropdown: bootstrap.Dropdown;

		mounted() {
			let self = this;
			core.libReady.then(() => this.dropdown = new bootstrap.Dropdown(this.$refs.btn as Element, {}));
			this.$el.addEventListener('shown.bs.dropdown', function() { core.dropdown = self });
			this.$el.addEventListener('hide.bs.dropdown', function() { core.dropdown = null; });
			this.$el.addEventListener('hidden.bs.dropdown', () => this.$emit('hide'));
		}

		private get ready() { return core.initialized; }

		private async hide() {
			await core.libReady;
			this.dropdown.hide();
		}

		private mouseenter() {
			if(core.dropdown && core.dropdown != this) (this.$refs.btn as HTMLButtonElement).click();
		}
	}
</script>
