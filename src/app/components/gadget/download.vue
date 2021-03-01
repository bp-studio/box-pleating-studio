<template>
	<a
		v-if="!disabled"
		:class="btn?'btn btn-primary':'dropdown-item'"
		:href="href"
		@click="download($event)"
		@mouseover="getFile"
		@contextmenu.stop="contextMenu"
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

	@Component
	export default class Download extends Vue {
		private href: string = "#";

		private downloaded: Function;
		private downloading: Promise<void>;
		private creating: string | Promise<string> = null;

		@Prop(Object) public file: FileFactory;
		@Prop(Boolean) public disabled: boolean;
		@Prop(Boolean) public btn: boolean = false;

		public download(event: Event) {
			if(this.href == "#") {
				this.downloading = new Promise(resolve => this.downloaded = resolve);
				if(event) event.preventDefault();
				this.getFile().then(() => (this.$el as any).click());
			} else {
				if(this.downloaded) this.downloaded();
				this.downloaded = null;
				this.$emit('download');
			}
		}

		public contextMenu() {
			this.getFile();
			this.$emit('download');
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
