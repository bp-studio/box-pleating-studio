<template>
	<div class="modal fade">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-body" style="max-height:80vh; overflow-y:auto;">
					<div v-if="record[index]" v-html="record[index]"></div>
					<div v-else class="m-5 display-2 text-muted text-center">
						<i class="fas fa-spinner fa-spin"></i>
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-primary" :disabled="index==0" @click="index--">
							<i class="fas fa-caret-left"></i>
						</button>
						<button class="btn btn-primary" :disabled="index==max" @click="index++">
							<i class="fas fa-caret-right"></i>
						</button>
					</div>
					<button type="button" class="btn btn-primary" data-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Watch } from 'vue-property-decorator';
	import { core } from '../core.vue';
	import $ from 'jquery/index';

	declare const gtag: any;
	declare const marked: any;
	declare const logs: number[];

	@Component
	export default class Version extends Vue {

		private record: Record<number, string> = {};
		private index: number;
		private max: number;
		private active: boolean = false;

		@Watch('index') onIndex() {
			this.load();
		}

		mounted() {
			this.index = this.max = logs.length - 1;
		}

		public async load(): Promise<boolean> {
			if(!this.record[this.index]) {
				try {
					let response = await fetch(`log/${logs[this.index]}.md`);
					Vue.set(this.record, this.index, marked(await response.text()));
				} catch(e) {
					if(this.active) {
						$(this.$el).modal('hide');
						core.alert(this.$t("message.connFail"));
					}
					return false;
				}
			}
			return true;
		}

		public async show() {
			this.active = true;
			if(await this.load()) {
				$(this.$el).modal();
				gtag('event', 'screen_view', { screen_name: 'News' });
			}
		}
	}
</script>
