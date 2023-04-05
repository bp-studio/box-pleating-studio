<template>
	<Dropdown label="Settings" icon="bp-tasks" :title="$t('toolbar.setting.title')">
		<template v-slot>
			<Fullscreen />
			<div class="dropdown-item" @click="toggle('showGrid')">
				<Hotkey :icon="Settings.showGrid ? 'fas fa-grip-lines text-secondary' : ''" ctrl hk="1">
					{{ $t('toolbar.setting.grid') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showHinge')">
				<Hotkey :icon="Settings.showHinge ? 'fas fa-grip-lines text-primary' : ''" ctrl hk="2">
					{{ $t('toolbar.setting.hinge') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showRidge')">
				<Hotkey :icon="Settings.showRidge ? 'fas fa-grip-lines text-danger' : ''" ctrl hk="3">
					{{ $t('toolbar.setting.ridge') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showAxialParallel')">
				<Hotkey :icon="Settings.showAxialParallel ? 'fas fa-grip-lines text-success' : ''" ctrl hk="4">
					{{ $t('toolbar.setting.axial') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showLabel')">
				<Hotkey :icon="Settings.showLabel ? 'fas fa-font' : ''" ctrl hk="5">
					{{ $t('toolbar.setting.label') }}
				</Hotkey>
			</div>
			<div class="dropdown-item" @click="toggle('showDot')">
				<Hotkey :icon="Settings.showDot ? 'fas fa-genderless' : ''" ctrl hk="6">
					{{ $t('toolbar.setting.tip') }}
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

<script lang="ts">
	export default { name: "SettingMenu" };
</script>

<script setup lang="ts">

	import { onMounted } from "vue";

	import { Divider, Dropdown, Hotkey } from "@/gadgets/menu";
	import { show } from "@/modals/modalFragment.vue";
	import Settings from "app/services/settingService";
	import HotkeyService from "app/services/hotkeyService";
	import Fullscreen from "./components/fullscreen.vue";

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
