<template>
	<div class="dropdown-item m-0" @click="execute">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	@Component
	export default class Opener extends Vue {

		@Prop(String) public accept: string;
		@Prop(Boolean) public multiple: boolean;

		public async execute(): Promise<void> {
			try {
				let handles = await showOpenFilePicker({
					multiple: true,
					types: [
						{
							description: this.$t('toolbar.file.BPF').toString(),
							accept: {
								'application/bpstudio': ['.bps', '.bpz'],
							},
						},
						{
							description: this.$t('toolbar.file.BPS.name').toString(),
							accept: {
								'application/bpstudio.project': ['.bps'],
							},
						},
						{
							description: this.$t('toolbar.file.BPZ.name').toString(),
							accept: {
								'application/bpstudio.workspace': ['.bpz'],
							},
						},
					],
				});
				this.$emit('open', handles);
			} catch(e) {
				// 失敗就算了
			}
		}
	}
</script>
