<template>
	<div class="h-100 scroll-shadow" style="border: 1px solid lightgray;">
		<div style="position: sticky; z-index: 10; top: 0; background: lightgray;">
			<table class="w-100 table table-sm table-bordered m-0">
				<thead>
					<tr>
						<th class="ps-1" v-t="'preference.command'"></th>
						<th class="ps-1" v-t="'preference.hotkey'"></th>
					</tr>
				</thead>
			</table>
		</div>
		<!-- 這邊拆成兩個 <table> 是因為在 <thead> 上面套用 position:sticky 的執行效果並不是很好，捲動時仍然會有些為跳動 -->
		<table class="w-100 table table-sm table-bordered m-0">
			<tbody>
				<template v-for="(list, name) in Settings.hotkey" :key="name">
					<tr @click="toggle(name as string)">
						<td colspan="2">
							<i class="fas fa-fw fa-caret-down" v-if="open[name]" />
							<i class="fas fa-fw fa-caret-right" v-else />
							{{ labels[name]['_'] }}
						</td>
					</tr>
					<tr v-for="(key, command) in list" :key="name + '.' + command" v-show="open[name]">
						<td class="ps-4">
							<label :for="name + '.' + command">{{ labels[name][command] }}</label>
						</td>
						<td class="p-0 position-relative">
							<input :id="name + '.' + command" type="text" class="border-0 w-100"
								   :value="CustomHotkeyService.formatKey(key)"
								   @focus="setFocus($event.target as HTMLInputElement)" @input.prevent
								   @keydown.prevent="setKey($event, name as string, command as string)" />
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
	export default { name: "KeyTable" };
</script>

<script setup lang="ts">
	/* eslint-disable require-atomic-updates */

	import { reactive } from "vue";

	import Settings from "app/services/settingService";
	import Dialogs from "app/services/dialogService";
	import CustomHotkeyService from "app/services/customHotkeyService";

	type KeyMap = Record<string, Record<string, string>>;

	const labels: KeyMap = {
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

	/** 開啟中的項目 */
	const open = reactive<Record<string, boolean>>({});

	/** 是否處於需要確認而未決的狀態 */
	let pending = false;

	async function setKey(e: KeyboardEvent, name: string, command: string): Promise<void> {
		// 這個情況中不阻止事件擴散，以便使用者可以用鍵盤操作 confirm 對話方塊
		if(pending) return;

		e.stopPropagation();
		const input = e.target as HTMLInputElement;
		if(e.key == "Escape" || e.key == " " || e.key == "Enter") input.blur();
		if(e.key == "Delete" || e.key == "Backspace") {
			Settings.hotkey[name][command] = "";
		}
		const key = CustomHotkeyService.toKey(e);
		if(!key) return;

		const find = CustomHotkeyService.findKey(key);
		if(find) {
			pending = true;
			const message = i18n.t("preference.confirmKey", [CustomHotkeyService.formatKey(key), getName(find)]);
			const confirm = await Dialogs.confirm(message);
			pending = false;
			if(!confirm) return;
		}
		Settings.hotkey[name][command] = key;
		if(find) {
			[name, command] = find.split(".");
			Settings.hotkey[name][command] = "";
		}
	}

	function setFocus(target: HTMLInputElement): void {
		const SECOND_DELAY = 10;
		const l = target.value.length;
		const move = (): void => target.setSelectionRange(l, l);
		setTimeout(move, 0);
		setTimeout(move, SECOND_DELAY);
	}

	function getName(path: string): string {
		const [name, command] = path.split(".");
		return labels[name]._ + " - " + labels[name][command];
	}

	function toggle(name: string): void {
		open[name] = !open[name];
	}

</script>

<style scoped lang="scss">
	table {
		td:first-child {
			cursor: pointer;
		}

		// <col width> 作廢了，所以只好改用 CSS 來定義。
		// 這件事似乎沒有什麼太好的解法，參見 https://stackoverflow.com/questions/67487357
		th,
		td {
			&:first-child {
				width: 66%;
			}

			&:last-child {
				width: 34%;
			}
		}
	}

	.mask {
		display: none;
	}

	input {
		outline: none;
		padding: 0.25rem;
		background: transparent;
		color: var(--bs-body-color);

		&:focus {
			box-shadow: inset 0 0 0.25rem var(--bs-primary);

			+.mask {
				display: block;
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
			}
		}
	}
</style>
