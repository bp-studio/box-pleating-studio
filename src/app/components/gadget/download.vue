<template>
	<a
		v-if="!disabled"
		:class="btn?'btn btn-primary':'dropdown-item'"
		:href="href"
		@click="download($event)"
		@mouseover="getFile"
		@contextmenu.stop="contextMenu"
		:download="filename"
		:title="$t('message.downloadHint')"
	>
		<slot></slot>
	</a>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { core } from '../core.vue';

	@Component
	export default class Download extends Vue {
		private href: string = "#";
		private https: boolean = false;

		private downloaded: Function;
		private downloading: Promise<void>;
		private creating: Blob | Promise<Blob> = null;

		@Prop(String) public type: string;
		@Prop(Boolean) public disabled: boolean;
		@Prop(Boolean) public btn: boolean = false;

		created() {
			if(location.protocol == "https:") {
				this.https = true;
				this.href = `/download?id=${core.id}&type=${this.type}`;
			}
		}

		protected get filename(): string | undefined {
			if(this.https) return undefined;
			return core.getFilename(this.type);
		}

		public download(event: Event) {
			if(this.https) {
				this.$emit('download');
			} else if(this.href == "#") {
				this.downloading = new Promise(resolve => this.downloaded = resolve);
				if(event) event.preventDefault();
				this.getFile().then(() => (this.$el as any).click());
			} else {
				if(this.downloaded) setTimeout(() => {
					this.downloaded();
					this.downloaded = null;
				}, 50);
				this.$emit('download');
			}
		}

		public contextMenu() {
			this.getFile();
			this.$emit('download');
		}

		public async getFile(): Promise<void> {
			if(this.https) return;

			await this.creating;
			if(this.href == "#") {
				this.creating = core.getBlob(this.type);
				let blob = await this.creating;
				this.href = blob ? URL.createObjectURL(blob) : "#";
				this.creating = null;
			}
		}

		public async reset() {
			if(this.https) return;

			// 延遲回收以免下載失敗
			await this.downloading;
			let href = this.href;
			setTimeout(() => {
				if(href.startsWith('blob')) URL.revokeObjectURL(href);
				if(this.href == href) this.href = "#";
			}, 5000);
		}
	}
</script>
