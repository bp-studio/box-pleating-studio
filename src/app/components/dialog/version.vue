<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-body scroll-shadow" style="max-height:70vh; border-radius:0.3rem;">
					<div v-if="record[index]" v-html="record[index]"></div>
					<div v-else class="m-5 display-2 text-muted text-center">
						<i class="bp-spinner fa-spin"></i>
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-primary" style="width:2.5rem" :disabled="index==0" @click="index--">
							<i class="fas fa-caret-left"></i>
						</button>
						<button class="btn btn-primary" style="width:2.5rem" :disabled="index==max" @click="index++">
							<i class="fas fa-caret-right"></i>
						</button>
					</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Watch } from 'vue-property-decorator';
	import * as bootstrap from 'bootstrap';

	declare const gtag: any;
	declare const marked: any;
	declare const logs: number[];

	@Component
	export default class Version extends Vue {

		protected record: Record<number, string> = {};
		protected index: number;
		protected max: number;
		protected active: boolean = false;
		protected modal: bootstrap.Modal;

		@Watch('index') onIndex(index: number) {
			this.load(index);
		}

		mounted() {
			if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', async (event) => {
				if(event.data.meta === 'workbox-broadcast-update') {
					let m = event.data.payload.path.match(/\d+(?=\.md$)/);
					if(m) {
						let index = logs.indexOf(Number(m[0]));
						delete this.record[index];
						this.load(index);
					}
				}
			});
			core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
			this.index = this.max = logs.length - 1;
		}

		public async load(index: number): Promise<boolean> {
			await core.libReady;
			if(!this.record[index]) {
				try {
					let response = await fetch(`log/${logs[index]}.md`);
					let html = marked(await response.text());
					html = html.replace(/<a href="http/g, '<a target="_target" rel="noopener" href="http');
					Vue.set(this.record, this.index, html);
				} catch(e) {
					if(this.active) {
						this.modal.hide();
						core.alert(this.$t("message.connFail"));
					}
					return false;
				}
			}
			return true;
		}

		public async show() {
			await core.libReady;
			this.active = true;
			if(await this.load(this.index)) {
				this.modal.show();
				var bt = this.$el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
				this.$el.addEventListener('shown.bs.modal', () => bt.focus(), { once: true });
				gtag('event', 'screen_view', { screen_name: 'News' });
			}
		}
	}
</script>
