<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'share.title'"></div>
				</div>
				<div class="modal-body p-5 text-center" v-if="sending">
					<i class="bp-spinner fa-spin display-4"></i>
				</div>
				<template v-else>
					<div class="modal-body p-3 text-center" v-if="error">{{error}}</div>
					<div class="modal-body" v-else>
						<div class="mb-2">
							<div class="input-group">
								<input class="form-control" :value="url" />
							</div>
						</div>
						<div v-if="ready" class="d-flex">
							<div>
								<button class="btn btn-primary" v-clipboard:copy="url" v-clipboard:success="onCopy" ref="bt">
									<i class="fas fa-copy"></i>
									{{$t('share.copy')}}
									<i
										class="fas fa-check d-inline-block"
										ref="success"
										style="transition:width .5s; width:0px; overflow:hidden;"
									></i>
								</button>
								<button v-if="canShare" class="btn btn-primary" @click="share">
									<i class="fas fa-share"></i>
									{{$t('share.share')}}
								</button>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import * as bootstrap from 'bootstrap';
	import BaseComponent from '../mixins/baseComponent';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	declare const LZ: any;

	@Component
	export default class Share extends BaseComponent {
		protected url: string = "";
		protected modal: bootstrap.Modal;
		protected canShare: boolean = Boolean(navigator.share);
		protected ready: boolean = false;
		protected sending: boolean = false;
		protected error: string = null;

		mounted(): void {
			core.libReady.then(() => {
				this.ready = true;
				this.modal = new bootstrap.Modal(this.$el);
			});
		}

		public json(): string {
			if(!this.design) return undefined;
			return JSON.stringify(this.design);
		}

		public async show(): Promise<void> {
			await core.libReady;
			this.url = "https://bpstudio.abstreamace.com/?project=" + LZ.compress(this.json());
			this.modal.show();
			this.shorten();
			this.$el.addEventListener('shown.bs.modal', () => {
				if(this.$refs.bt) (this.$refs.bt as HTMLButtonElement).focus();
			}, { once: true });
			gtag('event', 'screen_view', { screen_name: 'Share' });
		}

		protected onCopy(): void {
			const MESSAGE_DELAY = 3000;
			let s = this.$refs.success as HTMLSpanElement;
			s.style.width = "20px";
			setTimeout(() => s.style.width = "0px", MESSAGE_DELAY);
			gtag('event', 'share', { method: 'copy', content_type: 'link' });
		}

		protected share(): void {
			navigator.share({
				title: "Box Pleating Studio",
				text: this.$t("share.message", [this.design.title]).toString(),
				url: this.url,
			}).catch(() => {
				// 捕捉取消之類的錯誤，不處理
			});
			gtag('event', 'share', { method: 'app', content_type: 'link' });
		}

		private async shorten(): Promise<void> {
			const SHORT_INTERVAL = 10;
			this.sending = true;
			try {
				let response = await fetch("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(this.url), {
					cache: "reload",
				});
				this.url = await response.text();
				this.sending = false;
				if(!this.$refs.bt) {
					await new Promise<void>(resolve => {
						let int = setInterval(() => {
							if(this.$refs.bt) {
								clearInterval(int);
								resolve();
							}
						}, SHORT_INTERVAL);
					});
				}
				(this.$refs.bt as HTMLButtonElement).focus();
			} catch(e) {
				this.sending = false;
				this.error = this.$t('message.connFail').toString();
			}
		}
	}
</script>
