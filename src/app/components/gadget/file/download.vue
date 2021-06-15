<template>
	<a
		v-if="!disabled"
		:class="btn?'btn btn-primary':'dropdown-item'"
		:href="href"
		@click="execute($event)"
		@contextmenu.stop="execute($event)"
		:download="filename+'.'+type"
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

	@Component
	export default class Download extends Vue {
		private href: string = "#";

		private urls: string[] = [];
		private round: number = 0;

		@Prop(String) public type: string;
		@Prop(Boolean) public disabled: boolean;
		@Prop(Boolean) public btn: boolean = false;

		protected get filename(): string | undefined {
			return core.getFilename(this.type);
		}

		public execute(event: Event) {
			if(this.href == "#") event.preventDefault();
		}

		public async getFile(): Promise<void> {
			if(this.disabled) return;
			let round = this.round;
			this.href = "#";
			let blob = await core.getBlob(this.type);
			if(round == this.round && blob) {
				this.href = URL.createObjectURL(blob);
				this.urls.push(this.href);
			}
		}

		public async reset() {
			this.round++;
			setTimeout(() => {
				for(let url of this.urls) URL.revokeObjectURL(url);
				this.urls = [];
			}, 1000);
		}
	}
</script>
