<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4" v-if="initialized">
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
	import { Component, Vue, Watch } from 'vue-property-decorator';
	import Modal from '../mixins/modal';

	declare const marked: (s: string) => string;
	declare const logs: number[];

	@Component
	export default class Version extends Modal {
		protected record: Record<number, string> = {};
		protected index: number;
		protected max: number;

		protected getScreenName(): string { return 'News'; }

		@Watch('index') onIndex(index: number): void {
			this.load(index);
		}

		mounted(): void {
			if('serviceWorker' in navigator) {
				navigator.serviceWorker.addEventListener('message', event => {
					if(event.data.meta === 'workbox-broadcast-update') {
						let m = event.data.payload.path.match(/\d+(?=\.md$)/);
						if(m) {
							let index = logs.indexOf(Number(m[0]));
							delete this.record[index];
							this.load(index);
						}
					}
				});
			}
			this.index = this.max = logs.length - 1;
		}

		public async load(index: number): Promise<boolean> {
			await libReady;
			if(!this.record[index]) {
				try {
					let response = await fetch(`log/${logs[index]}.md`);
					let html = marked(await response.text());
					html = html.replace(/<a href="http/g, '<a target="_target" rel="noopener" href="http');
					Vue.set(this.record, this.index, html);
				} catch(e) {
					if(this.initialized) {
						this.modal.hide();
						core.alert(this.$t("message.connFail"));
					}
					return false;
				}
			}
			return true;
		}

		protected onBeforeShow(): Promise<boolean> {
			return this.load(this.index);
		}
	}
</script>
