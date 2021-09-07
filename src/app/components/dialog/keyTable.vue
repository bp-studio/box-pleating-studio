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
				<template v-for="(list, name) in hotkey">
					<tr :key="name" @click="toggle(name)">
						<td colspan="2">
							<i class="fas fa-fw fa-caret-down" v-if="open[name]"></i>
							<i class="fas fa-fw fa-caret-right" v-else></i>
							{{labels[name]['_']}}
						</td>
					</tr>
					<tr v-for="(key, command) in list" :key="name+'.'+command" v-show="open[name]">
						<td class="ps-4">{{labels[name][command]}}</td>
						<td class="p-0 position-relative">
							<input
								type="text"
								class="key border-0 w-100"
								:value="format(key)"
								@focus="setFocus($event.target)"
								@input.prevent
								@keydown.prevent="setKey($event, name, command)"
							/>
							<!-- input 獲得焦點之後用來阻斷一切滑鼠動作的遮罩 -->
							<div class="mask" @mousedown.capture.prevent></div>
						</td>
					</tr>
				</template>
			</tbody>
		</table>
	</div>
</template>

<script lang="ts">
	/* eslint-disable require-atomic-updates */
	import { Component, Vue } from 'vue-property-decorator';

	type KeyMap = Record<string, Record<string, string>>

	@Component
	export default class KeyTable extends Vue {
		protected open: Record<string, boolean> = {};
		protected pending: boolean = false;
		protected labels: KeyMap = {
			v: {
				_: "View",
				t: "Tree structure",
				l: "Layout",
				zi: "Zoom in",
				zo: "Zoom out",
			},
			m: {
				_: "Move",
				u: "Up",
				d: "Down",
				l: "Left",
				r: "Right",
			},
			d: {
				_: "Dimension",
				ri: "Radius/Length increase",
				rd: "Radius/Length decrease",
				hi: "Height increase",
				hd: "Height decrease",
				wi: "Width increase",
				wd: "Width decrease",
			},
			n: {
				_: "Navigation",
				d: "Go to dual object",
				cn: "Next configuration",
				cp: "Previous configuration",
				pn: "Next pattern",
				pp: "Previous pattern",
			},
		};

		protected get hotkey(): KeyMap {
			return core.settings.hotkey as KeyMap;
		}

		protected async setKey(e: KeyboardEvent, name: string, command: string): Promise<void> {
			// 這個情況中不阻止事件擴散，以便使用者可以用鍵盤操作 confirm 對話方塊
			if(this.pending) return;

			e.stopPropagation();
			let input = e.target as HTMLInputElement;
			if(e.key == 'Escape' || e.key == ' ' || e.key == 'Enter') input.blur();
			if(e.key == 'Delete' || e.key == 'Backspace') {
				this.hotkey[name][command] = '';
				core.settings.save();
			}
			let key = toKey(e);
			if(!key) return;

			let find = findKey(key, this.hotkey);
			if(find) {
				this.pending = true;
				let confirm = await core.confirm(this.$t('preference.confirmKey', [formatKey(key), this.getName(find)]));
				this.pending = false;
				if(!confirm) return;
			}
			this.hotkey[name][command] = key;
			if(find) {
				[name, command] = find.split('.');
				this.hotkey[name][command] = '';
			}
			core.settings.save();
		}

		private getName(path: string): string {
			let [name, command] = path.split('.');
			return this.labels[name]._ + ' - ' + this.labels[name][command];
		}

		protected setFocus(target: HTMLInputElement): void {
			const SECOND_DELAY = 10;
			let l = target.value.length;
			let move = (): void => target.setSelectionRange(l, l);
			setTimeout(move, 0);
			setTimeout(move, SECOND_DELAY);
		}

		protected format(key: string): string {
			return formatKey(key);
		}

		protected toggle(name: string): void {
			Vue.set(this.open, name, !this.open[name]);
		}
	}
</script>

<style>
	input.key {
		outline: none;
		padding: 0.25rem;
		background: transparent;
	}

	input.key:focus {
		box-shadow: inset 0 0 0.25rem var(--bs-primary);
	}

	.mask {
		display: none;
	}

	input.key:focus + .mask {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
