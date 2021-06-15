<template>
	<div class="dropdown-item m-0" @click="execute">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class Opener extends Vue {

		@Prop(String) public accept: string;
		@Prop(Boolean) public multiple: boolean;

		public async execute() {
			try {
				let handles = await showOpenFilePicker({
					multiple: true,
					types: [
						{
							description: this.$t('toolbar.file.BPF').toString(),
							accept: {
								'application/box-pleating-studio': ['.bps', '.bpz'],
							},
						},
						{
							description: this.$t('toolbar.file.BPS').toString(),
							accept: {
								'application/box-pleating-studio-project': ['.bps'],
							},
						},
						{
							description: this.$t('toolbar.file.BPZ').toString(),
							accept: {
								'application/box-pleating-studio-workspace': ['.bpz'],
							},
						},
					]
				});
				this.$emit('open', handles);
			} catch(e) {
				return;
			}
		}
	}
</script>
