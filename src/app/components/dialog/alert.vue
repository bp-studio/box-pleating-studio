<template>
	<div id="alert" class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body"></div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import $ from 'jquery/index';

	@Component
	export default class Alert extends Vue {
		private promise: Promise<void> = null;

		public async show(message: string): Promise<void> {
			while(this.promise) await this.promise;
			await (this.promise = this.run(message));
		}

		private run(message: string): Promise<void> {
			let a = $('#alert');
			let p = new Promise<void>(resolve => a.one('hidden.bs.modal', () => {
				this.promise = null;
				resolve();
			}));
			a.find('.modal-body').html(message);
			a.modal({ backdrop: 'static' });
			return p;
		}
	}
</script>
