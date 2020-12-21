<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'share.title'"></div>
				</div>
				<div class="modal-body">
					<div class="mb-2">
						<input class="form-control" :value="url" />
					</div>
					<div>
						<button class="btn btn-primary" v-clipboard:copy="url" v-clipboard:success="onCopy">
							<i class="fas fa-copy"></i> {{$t('share.copy')}}
							<i
								class="fas fa-check d-inline-block"
								ref="success"
								style="transition:width .5s; width:0px; overflow:hidden;"
							></i>
						</button>
						<button v-if="canShare" class="btn btn-primary" @click="share">
							<i class="fas fa-share"></i> {{$t('share.share')}}
						</button>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import BaseComponent from '../mixins/baseComponent';
	import $ from 'jquery/index';

	declare const LZ: any;

	@Component
	export default class Share extends BaseComponent {
		private url: string = "";
		private canShare: boolean = !!navigator.share;

		public json() {
			if(!this.design) return undefined;
			return JSON.stringify(this.design);
		}

		public show() {
			this.url = "https://bpstudio.abstreamace.com/?project=" + LZ.compress(this.json());
			$(this.$el).modal();
		}

		private onCopy() {
			let s = this.$refs.success as HTMLSpanElement;
			s.style.width = "20px";
			setTimeout(() => s.style.width = "0px", 3000);
		}

		private share() {
			navigator.share({
				title: "Box Pleating Studio",
				text: this.$t("share.message", [this.design.title]),
				url: this.url
			})
				.catch(() => { }); // 捕捉取消之類的錯誤，不處理
		}
	}
</script>
