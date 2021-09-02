<template>
	<div class="h-100 scroll-shadow" style="border:1px solid lightgray;">
		<div style="position:sticky; top:0; background:lightgray;">
			<table class="w-100 table table-sm table-bordered m-0">
				<colgroup>
					<col width="66%" />
					<col width="34%" />
				</colgroup>
				<thead>
					<tr>
						<th class="ps-1" v-t="'preference.command'"></th>
						<th class="ps-1" v-t="'preference.hotkey'"></th>
					</tr>
				</thead>
			</table>
		</div>
		<table class="w-100 table table-sm table-bordered m-0">
			<colgroup>
				<col width="66%" />
				<col width="34%" />
			</colgroup>
			<tbody>
				<template v-for="(list, name) in core.settings.hotkey">
					<tr :key="name" @click="toggle(name)">
						<td colspan="2">
							<i class="fas fa-fw fa-caret-down" v-if="open[name]"></i>
							<i class="fas fa-fw fa-caret-right" v-else></i>
							{{capitalize(name)}}
						</td>
					</tr>
					<tr v-for="(key, command) in list" :key="command" v-show="open[name]">
						<td class="ps-4">{{capitalize(command.toString())}}</td>
						<td
							class="ps-1"
							:class="select==name+'.'+command?'bg-primary text-white':''"
							@click.stop="select=name+'.'+command"
						>{{format(key)}}</td>
					</tr>
				</template>
			</tbody>
		</table>
	</div>
</template>

<script lang="ts">
	/* eslint-disable require-atomic-updates */
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class KeyTable extends Vue {
		protected open: Record<string, boolean> = {};
		protected select: string | null = null;
		protected controller = new AbortController();
		protected pending: boolean = false;

		mounted(): void {
			document.addEventListener('click', () => {
				if(!this.pending) this.select = null;
			}, {
				signal: this.controller.signal,
			} as AddEventListenerOptions);
			document.addEventListener("keydown", e => this.setKey(e), {
				signal: this.controller.signal,
				capture: true,
			} as AddEventListenerOptions);
		}

		beforeDestroy(): void {
			this.controller.abort();
		}

		protected get core(): typeof core { return core; }

		private async setKey(e: KeyboardEvent): Promise<void> {
			if(!this.select || e.key.length > 1 || e.key == ' ') return;
			e.stopPropagation();
			let key = toKey(e);
			let [name, command] = this.select.split('.');
			let find = findKey(key, core.settings.hotkey);
			if(find) {
				this.pending = true;
				let confirm = await core.confirm(this.$t('preference.confirmKey', [this.format(key), find]));
				this.pending = false;
				if(!confirm) return;
			}
			core.settings.hotkey[name][command] = key;
			this.select = null;
			if(find) {
				[name, command] = find.split('.');
				core.settings.hotkey[name][command] = '';
			}
			core.settings.save();
		}

		protected format(key: string): string {
			return key.replace(/^s/, 'SHIFT + ');
		}

		protected toggle(name: string): void {
			Vue.set(this.open, name, !this.open[name]);
		}

		protected capitalize(str: string): string {
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
	}
</script>
