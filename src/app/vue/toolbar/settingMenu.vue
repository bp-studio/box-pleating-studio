<template>
	<Dropdown label="Settings" icon="bp-tasks" :title="$t('toolbar.setting.title')">
		<template v-slot>
			<Fullscreen />
			<DropdownCheck v-model="Settings.showGrid" icon="fas fa-grip-lines" :color="Studio.style.grid.color" hk="1">
				{{ $t('toolbar.setting.grid') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.showHinge" icon="fas fa-grip-lines" :color="Studio.style.hinge.color" hk="2">
				{{ $t('toolbar.setting.hinge') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.showRidge" icon="fas fa-grip-lines" :color="Studio.style.ridge.color" hk="3">
				{{ $t('toolbar.setting.ridge') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.showAxialParallel" icon="fas fa-grip-lines" :color="Studio.style.axisParallel.color"
						   hk="4">
				{{ $t('toolbar.setting.axial') }}
			</DropdownCheck>
			<DropdownCheck v-model="Settings.showLabel" icon="fas fa-font" :color="Studio.style.label.color" hk="5">
				{{ $t('toolbar.setting.label') }}
			</DropdownCheck>
			<div class="dropdown-item" role="menuitemcheckbox" @click="toggle('showDot')">
				<Hotkey ctrl hk="6">
					<template v-slot:icon>
						<span class="dot-stack" v-if="Settings.showDot">
							<i class="fas fa-circle" :style="'color:' + toHex(Studio.style.dot.fill)"></i>
							<i class="far fa-circle"></i>
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
	import { show } from "@/modals/modalFragment.vue";
	import Settings from "app/services/settingService";
	import HotkeyService from "app/services/hotkeyService";
	import Studio from "app/services/studioService";
	import Fullscreen from "./components/fullscreen.vue";
	import { toHex } from "shared/utils/color";

	defineOptions({ name: "SettingMenu" });

	onMounted(() => {
		HotkeyService.register(() => toggle("showGrid"), "1");
		HotkeyService.register(() => toggle("showHinge"), "2");
		HotkeyService.register(() => toggle("showRidge"), "3");
		HotkeyService.register(() => toggle("showAxialParallel"), "4");
		HotkeyService.register(() => toggle("showLabel"), "5");
		HotkeyService.register(() => toggle("showDot"), "6");
	});

	function toggle(key: KeysOfType<typeof Settings, boolean>): void {
		Settings[key] = !Settings[key];
	}

	function dPad(): void {
		gtag("event", "dpad_" + (Settings.showDPad ? "on" : "off"));
	}

</script>

<style scoped lang="scss">
	.dot-stack {
		position: relative;
		height: 1rem;

		> * {
			position: absolute;
			top: 0.25rem;
			left: 0.5rem;

			/* Simply setting font size won't work on desktops. */
			transform: scale(0.5);
		}
	}
</style>
