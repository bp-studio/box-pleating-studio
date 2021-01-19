<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'share.title'"></div>
				</div>
				<div class="modal-body">
					<div class="mb-2">
						<div class="input-group">
							<input class="form-control" :value="url" :disabled="sending" />
							<button class="btn btn-primary" v-if="!short" @click="shorten" :disabled="sending">
								{{$t('share.shorten')}}
								<i class="bp-spinner fa-spin" v-if="sending"></i>
							</button>
						</div>
					</div>
					<div v-if="ready" class="d-flex">
						<div>
							<button class="btn btn-primary" :disabled="sending" v-clipboard:copy="url" v-clipboard:success="onCopy">
								<i class="fas fa-copy"></i>
								{{$t('share.copy')}}
								<i
									class="fas fa-check d-inline-block"
									ref="success"
									style="transition:width .5s; width:0px; overflow:hidden;"
								></i>
							</button>
							<button v-if="canShare" :disabled="sending" class="btn btn-primary" @click="share">
								<i class="fas fa-share"></i>
								{{$t('share.share')}}
							</button>
						</div>
						<div class="flex-grow-1 text-end col-form-label">{{error}}</div>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import { core } from '../core.vue';
	import * as bootstrap from 'bootstrap';

	declare const LZ: any;
	declare const gtag: any;
	declare const VueClipboard: any;

	@Component
	export default class Share extends BaseComponent {
		private url: string = "";
		private modal: Bootstrap.Modal;
		private canShare: boolean = !!navigator.share;
		private ready: boolean = false;
		private sending: boolean = false;
		private short: boolean = false;
		private error: string = null;

		mounted() {
			core.libReady.then(() => {
				this.ready = true;
				this.modal = new bootstrap.Modal(this.$el);
			});
		}

		public json() {
			if(!this.design) return undefined;
			return JSON.stringify(this.design);
		}

		public async show() {
			await core.libReady;
			this.url = "https://bpstudio.abstreamace.com/?project=" + LZ.compress(this.json());
			this.short = false;
			this.modal.show();
			gtag('event', 'screen_view', { screen_name: 'Share' });
		}

		private onCopy() {
			let s = this.$refs.success as HTMLSpanElement;
			s.style.width = "20px";
			setTimeout(() => s.style.width = "0px", 3000);
			gtag('event', 'share', { method: 'copy', content_type: 'link' });
		}

		private share() {
			navigator.share({
				title: "Box Pleating Studio",
				text: this.$t("share.message", [this.design.title]),
				url: this.url
			}).catch(() => { }); // 捕捉取消之類的錯誤，不處理
			gtag('event', 'share', { method: 'app', content_type: 'link' });
		}

		private async shorten() {
			this.sending = true;
			try {
				let response = await fetch("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(this.url));
				this.url = await response.text();
				this.short = true;
			} catch(e) {
				this.error = this.$t('message.connFail');
				setTimeout(() => this.error = null, 3000);
			}
			this.sending = false;
		}
	}
</script>
