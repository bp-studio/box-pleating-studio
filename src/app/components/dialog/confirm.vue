<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body">{{message}}</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal" v-t="'keyword.no'"></button>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.yes'" v-on:click="value=true"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import Dialog from '../mixins/dialog';

	@Component
	export default class Confirm extends Dialog<boolean> {
		private value: boolean = false;

		protected key(e: KeyboardEvent): void {
			let key = e.key.toLowerCase();
			if(key == "y") this.value = true;
			if(key == "y" || key == "n") this.close();
		}

		protected resolve(res: (v: boolean) => void): void {
			this.value = false;
			this.$el.addEventListener('hidden.bs.modal', () => res(this.value), { once: true });
		}
	}
</script>
