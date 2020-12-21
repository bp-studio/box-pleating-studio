<template>
	<a
		v-if="!disabled"
		:class="btn?'btn btn-primary':'dropdown-item'"
		:href="href"
		@click="download"
		@mouseover="getFile"
		@contextmenu.stop="getFile"
		:download="file.name"
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
	import { FileFactory } from '../import/types';

	declare const saveAs: any;

	@Component
	export default class Download extends Vue {
		private href: string = "#";

		private downloaded: Function;
		private downloading: Promise<void>;
		private creating: string | Promise<string> = null;

		@Prop(Object) public file: FileFactory;
		@Prop(Boolean) public disabled: boolean;
		@Prop(Boolean) public btn: boolean = false;

		public async download() {
			if(this.href == "#") {
				this.downloading = new Promise(resolve => this.downloaded = resolve);
				event.preventDefault();
				await this.getFile();
				(this.$el as any).click();
			} else if(this.downloaded) {
				this.downloaded();
				this.downloaded = null;
			}
		}

		public async getFile(): Promise<void> {
			await this.creating;
			if(this.href == "#") {
				this.creating = this.file.content();
				this.href = await this.creating;
				this.creating = null;
			}
		}

		public async reset() {
			// 延遲回收以免下載失敗
			await this.downloading;
			setTimeout(() => {
				URL.revokeObjectURL(this.href);
				this.href = "#";
			}, 500);
		}
	}
</script>
