<template>
	<div class="h-100 scroll-shadow key-table" style="border: 1px solid lightgray;">
		<div style="position: sticky; z-index: 10; top: 0; background: lightgray;">
			<table class="w-100 table table-sm table-bordered m-0">
				<thead>
					<tr>
						<th class="ps-1">{{ $t("preference.command") }}</th>
						<th class="ps-1">{{ $t("preference.hotkey") }}</th>
					</tr>
				</thead>
			</table>
		</div>
		<!--
			We break it into two <table>s here since position:sticky is not supported on <thead> for Chrome<=90.
			(See https://caniuse.com/css-sticky)
			Even for newer Chrome, the result isn't all that great; there will still be glitches on scrolling.
		-->
		<table class="w-100 table table-sm table-bordered m-0">
			<tbody>
				<template v-for="(list, name) in Settings.hotkey" :key="name">
					<tr @click="toggle(name)">
						<td colspan="2">
							<i class="fas fa-caret-down fa-fw" v-if="open[name]" />
							<i class="fas fa-caret-right fa-fw" v-else />
							{{ labels[name]['_'] }}
						</td>
					</tr>
					<tr v-for="(key, command) in list" :key="name + '.' + command" v-show="open[name]">
						<td class="ps-4">
							<label :for="name + '.' + command">{{ labels[name][command] }}</label>
						</td>
						<td class="p-0 position-relative">
							<input :id="name + '.' + command" type="text" class="border-0 w-100"
								   :value="CustomHotkeyService.formatKey(key)" @focus="setFocus($event.target)" @input.prevent
								   @keydown.prevent="setKey($event, name, command)" />
							<!-- A mask for blocking mouse actions after the input getting focus -->
							<div class="mask" @mousedown.capture.prevent></div>
						</td>
					</tr>
				</template>
			</tbody>
		</table>
	</div>
</template>

<script setup lang="ts">

	import { reactive } from "vue";

	import Settings from "app/services/settingService";
	import Dialogs from "app/services/dialogService";
	import CustomHotkeyService from "app/services/customHotkeyService";
	import { useThrottledGA } from "app/utils/ga";

	defineOptions({ name: "KeyTable" });

	const ONE_HOUR = 3600000;
	const ga = useThrottledGA("custom_key", ONE_HOUR);

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

	/** Opened items */
	const open = reactive<Record<string, boolean>>({});

	/** If we're in a state that requires confirming and not yet decided. */
	let pending = false;

	type key = string | number;

	async function setKey(e: KeyboardEvent, name: key, command: key): Promise<void> {
		// We don't stop the propagation in this case,
		// so that users can continue to operate the confirm dialog with keyboard.
		if(pending) return;

		e.stopPropagation();
		const input = e.target as HTMLInputElement;
		if(e.key == "Escape" || e.key == " " || e.key == "Enter") input.blur();
		if(e.key == "Delete" || e.key == "Backspace") {
			Settings.hotkey[name][command] = "";
		}
		const key = CustomHotkeyService.toKey(e);
		if(!key) return;

		const existingKey = CustomHotkeyService.findKey(key);
		if(existingKey && !await confirmKey(key, existingKey)) return;

		ga();
		Settings.hotkey[name][command] = key;
		if(existingKey) {
			[name, command] = existingKey.split(".");
			Settings.hotkey[name][command] = "";
		}
	}

	/** Confirm overwriting an existing key. */
	async function confirmKey(key: string, existingKey: string): Promise<boolean> {
		pending = true;
		const message = i18n.t(
			"preference.confirmKey",
			[CustomHotkeyService.formatKey(key), getName(existingKey)]
		);
		const confirm = await Dialogs.confirm(message);
		pending = false;
		return confirm;
	}

	function setFocus(target: unknown): void {
		const t = target as HTMLInputElement;
		const SECOND_DELAY = 10;
		const l = t.value.length;
		const move = (): void => t.setSelectionRange(l, l);
		setTimeout(move, 0);
		setTimeout(move, SECOND_DELAY);
	}

	function getName(path: string): string {
		const [name, command] = path.split(".");
		return labels[name]._ + " - " + labels[name][command];
	}

	function toggle(name: key): void {
		open[name] = !open[name];
	}

</script>
