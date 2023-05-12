<template>
	<Dropdown label="Settings" icon="bp-tasks" :title="$t('toolbar.setting.title')">
		<template v-slot>
			<Fullscreen />
			<div class="dropdown-item" @click="toggle('showGrid')">
				<Hotkey :icon="Settings.showGrid ? 'fas fa-grip-lines' : ''" :color="Studio.style.grid.color" ctrl hk="1">
					{{ $t('toolbar.setting.grid') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showHinge')">
				<Hotkey :icon="Settings.showHinge ? 'fas fa-grip-lines' : ''" :color="Studio.style.hinge.color" ctrl hk="2">
					{{ $t('toolbar.setting.hinge') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showRidge')">
				<Hotkey :icon="Settings.showRidge ? 'fas fa-grip-lines' : ''" :color="Studio.style.ridge.color" ctrl hk="3">
					{{ $t('toolbar.setting.ridge') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showAxialParallel')">
				<Hotkey :icon="Settings.showAxialParallel ? 'fas fa-grip-lines' : ''" ctrl hk="4"
						:color="Studio.style.axisParallel.color">
					{{ $t('toolbar.setting.axial') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showLabel')">
				<Hotkey :icon="Settings.showLabel ? 'fas fa-font' : ''" ctrl hk="5">
					{{ $t('toolbar.setting.label') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showDot')">
				<Hotkey ctrl hk="6">
					<template v-slot:icon>
						<span class="dot-stack" v-if="Settings.showDot">
							<i class="fas fa-circle" :style="'color:' + toHex(Studio.style.hinge.color)"></i>
							<i class="far fa-circle"></i>
						</span>
						<i v-else />
					</template>
					<span>{{ $t('toolbar.setting.tip') }}</span>
				</Hotkey>
			</div>
			<Divider />
			<div class="dropdown-item" @click="toggle('showStatus')">
				<i v-if="!Settings.showStatus" /><i class="fas fa-compass" v-else />{{ $t('toolbar.setting.status') }}
			</div>
			<div class="touch-only">
				<div class="dropdown-item" @click="toggle('showDPad')">
					<i v-if="!Settings.showDPad" /><i class="fas fa-arrows-alt" v-else />{{ $t('toolbar.setting.dPad') }}
				</div>
			</div>
			<Divider />
			<div class="dropdown-item" @click="show('pref')">
				<i class="fas fa-cog" />{{ $t('toolbar.setting.preference') }}
			</div>
		</template>
	</Dropdown>
</template>

<script setup lang="ts">

	import { onMounted } from "vue";

	import { Divider, Dropdown, Hotkey } from "@/gadgets/menu";
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
		if(key == "showDPad") gtag("event", "dpad_" + (Settings.showDPad ? "on" : "off"));
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
