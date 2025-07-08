<template>
	<Dropdown label="Settings" icon="bp-tasks" :title="$t('toolbar.setting.title')">
		<template v-slot>
			<Fullscreen />
			<DropdownCheck v-model="Settings.display.grid" icon="fas fa-grip-lines" :color="Studio.style.grid.color" hk="1">
				{{ $t('toolbar.setting.grid') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.display.hinge" icon="fas fa-grip-lines" :color="Studio.style.hinge.color" hk="2">
				{{ $t('toolbar.setting.hinge') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.display.ridge" icon="fas fa-grip-lines" :color="Studio.style.ridge.color" hk="3">
				{{ $t('toolbar.setting.ridge') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.display.axialParallel" icon="fas fa-grip-lines" :color="Studio.style.axisParallel.color"
				hk="4">
				{{ $t('toolbar.setting.axial') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.display.label" icon="fas fa-font" :color="Studio.style.label.color" hk="5">
				{{ $t('toolbar.setting.label') }}
			</DropdownCheck>
			<div class="dropdown-item" role="menuitemcheckbox" @click="toggle('dot')">
				<Hotkey ctrl hk="6">
					<template v-slot:icon>
						<span class="dot-stack" v-if="Settings.display.dot">
							<i class="fas fa-circle" :style="'color:' + toHex(Studio.style.dot.fill)"/>
							<i class="far fa-circle"/>
						</span>
						<i v-else />
					</template>
					<span>{{ $t('toolbar.setting.tip') }}</span>
				</Hotkey>
			</div>
			<Divider />
			<DropdownCheck v-model="Settings.showStatus" icon="fas fa-compass">
				{{ $t('toolbar.setting.status') }}
			</DropdownCheck>
			<div class="touch-only">
				<DropdownCheck v-model="Settings.showDPad" icon="fas fa-arrows-alt" @click="dPad">
					{{ $t('toolbar.setting.dPad') }}
				</DropdownCheck>
			</div>
			<Divider />
			<DropdownItem @click="show('pref')">
				<i class="fas fa-cog" />{{ $t('toolbar.setting.preference') }}
			</DropdownItem>
		</template>
	</Dropdown>
</template>

<script setup lang="ts">

	import { onMounted } from "vue";

	import { Divider, Dropdown, Hotkey, DropdownItem, DropdownCheck } from "@/gadgets/menu";
	import { show } from "@/modals/modals";
	import Settings from "app/services/settingService";
	import HotkeyService from "app/services/hotkeyService";
	import Studio from "app/services/studioService";
	import Fullscreen from "./components/fullscreen.vue";
	import { toHex } from "shared/utils/color";

	defineOptions({ name: "SettingMenu" });

	onMounted(() => {
		HotkeyService.register(() => toggle("grid"), "1");
		HotkeyService.register(() => toggle("hinge"), "2");
		HotkeyService.register(() => toggle("ridge"), "3");
		HotkeyService.register(() => toggle("axialParallel"), "4");
		HotkeyService.register(() => toggle("label"), "5");
		HotkeyService.register(() => toggle("dot"), "6");
	});

	function toggle(key: keyof typeof Settings.display): void {
		Settings.display[key] = !Settings.display[key];
	}

	function dPad(): void {
		gtag("event", "dpad_" + (Settings.showDPad ? "on" : "off"));
	}

</script>
