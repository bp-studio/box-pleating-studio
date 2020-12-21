<template>
	<div id="confirm" class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body"></div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal" v-t="'keyword.no'"></button>
					<button type="button" class="btn btn-primary" data-dismiss="modal" v-t="'keyword.yes'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import $ from 'jquery/index';

	@Component
	export default class Confirm extends Vue {
		private promise: Promise<boolean> = null;

		public async show(message: string): Promise<boolean> {
			while(this.promise) await this.promise;
			return await (this.promise = this.run(message));
		}

		private run(message: string): Promise<boolean> {
			let c = $('#confirm');
			let p = new Promise<boolean>(resolve => {
				let value: boolean = false;
				c.find('.btn-primary').one('click', () => {
					value = true
				});
				c.one('hidden.bs.modal', () => {
					this.promise = null;
					resolve(value);
				});
			});
			c.find('.modal-body').html(message);
			c.modal({ backdrop: 'static' });
			return p;
		}
	}
</script>
