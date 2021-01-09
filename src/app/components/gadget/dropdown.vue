<template>
	<div class="btn-group">
		<button
			ref="btn"
			type="button"
			@mouseenter="mouseenter"
			:title="title"
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

		private bt: any;
		private dropdown: bootstrap.Dropdown;

		mounted() {
			let self = this;
			this.dropdown = new bootstrap.Dropdown(this.$refs.btn as Element, {})
			this.$el.addEventListener('shown.bs.dropdown', function() { core.dropdown = self });
			this.$el.addEventListener('hide.bs.dropdown', function() { core.dropdown = null; });
			this.$el.addEventListener('hidden.bs.dropdown', () => this.$emit('hide'));
		}

		private hide() {
			this.dropdown.hide();
		}

		private mouseenter() {
			if(core.dropdown && core.dropdown != this) (this.$refs.btn as HTMLButtonElement).click();
		}
	}
</script>
