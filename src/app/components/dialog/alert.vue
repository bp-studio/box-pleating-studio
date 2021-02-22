<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body">{{message}}</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import Dialog from '../mixins/dialog';

	@Component
	export default class Alert extends Dialog<void> {
		protected resolve(res: () => void) {
			this.$el.addEventListener('hidden.bs.modal', () => res(), { once: true });
		}
	}
</script>
