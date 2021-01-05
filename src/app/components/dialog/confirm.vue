<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body">{{message}}</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal" v-t="'keyword.no'"></button>
					<button type="button" class="btn btn-primary" data-dismiss="modal" v-t="'keyword.yes'"></button>
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
		protected resolve(res, el) {
			let value: boolean = false;
			el.find('.btn-primary').one('click', () => value = true);
			el.one('hidden.bs.modal', () => res(value));
		}
	}
</script>
