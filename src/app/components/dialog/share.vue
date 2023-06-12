<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4" v-if="initialized">
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
						<div class="d-flex">
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
	import Modal from '../mixins/modal';

	@Component
	export default class Share extends Modal {
		protected url: string = "";
		protected canShare: boolean = Boolean(navigator.share);
		protected sending: boolean = false;
		protected error: string | null = null;

		protected getScreenName(): string { return 'Share'; }

		protected onBeforeShow(): boolean {
			if(!core.design) return false;
			let data = LZ.compress(JSON.stringify(core.design));
			this.url = "https://bpstudio.abstreamace.com/?project=" + data;
			this.shorten();
			return true;
		}

		protected getFocusButton(): HTMLButtonElement {
			return this.$refs.bt as HTMLButtonElement;
		}

		protected async onCopy(): Promise<void> {
			try {
				// 這個理論上才是現代瀏覽器採用的文字複製方法，
				// 但是我仍然引用 vue-clipboard 來使功能適用於舊版的 Safari
				await navigator.clipboard.writeText(this.url);
			} catch(e) { }
			const MESSAGE_DELAY = 3000;
			let s = this.$refs.success as HTMLSpanElement;
			s.style.width = "20px";
			setTimeout(() => s.style.width = "0px", MESSAGE_DELAY);
			gtag('event', 'share', { method: 'copy', content_type: 'link' });
		}

		protected share(): void {
			navigator.share({
				title: "Box Pleating Studio",
				text: this.$t("share.message", [core.design!.title]).toString(),
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
				// For unknown reason, using `{ cache: "reload" }`
				// option here will lead to no-response error in Safari.
				let response = await fetch("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(this.url));
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
