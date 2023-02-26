<template>
	<Dropdown icon="bp-file-alt" :title="$t('toolbar.file.title')" @hide="reset" @show="init" ref="menu">
		<div class="dropdown-item" @click="Workspace.create()">
			<i class="far fa-file" />{{ $t('toolbar.file.new') }}
		</div>
		<Divider />

		<template v-if="isFileApiEnabled">
			<Opener class="dropdown-item m-0" ref="opn" @open="open($event)">
				<Hotkey icon="far fa-folder-open" ctrl hk="O">{{ $t('toolbar.file.open') }}</Hotkey>
			</Opener>
			<RecentMenu />
			<Divider />
			<DropdownItem :disabled="!Studio.project" @click="save()">
				<Hotkey icon="fas fa-save" ctrl hk="S">{{ $t('toolbar.file.BPS.save') }}</Hotkey>
			</DropdownItem>
			<SaveAs :disabled="!Studio.project" type="bps" ref="bps" @save="notify($event)" :desc="$t('toolbar.file.BPS.name')"
					mime="application/bpstudio.project+json">
				<Hotkey icon="fas fa-save" ctrl shift hk="S">{{ $t('toolbar.file.BPS.saveAs') }}</Hotkey>
			</SaveAs>
			<DropdownItem :disabled="!Studio.project" @click="saveAll()">
				<Hotkey icon="fas fa-save" ctrl hk="K">{{ $t('toolbar.file.BPS.saveAll') }}</Hotkey>
			</DropdownItem>
			<SaveAs :disabled="!Studio.project" type="bpz" ref="bpz" @save="notifyAll($event)" :desc="$t('toolbar.file.BPZ.name')"
					mime="application/bpstudio.workspace+zip">
				<Hotkey icon="fas fa-save">{{ $t('toolbar.file.BPZ.save') }}</Hotkey>
			</SaveAs>
		</template>
		<template v-else>
			<Uploader accept=".bps, .bpz, .json, .zip" ref="opn" multiple @upload="upload($event)">
				<Hotkey icon="far fa-folder-open" ctrl hk="O">{{ $t('toolbar.file.open') }}</Hotkey>
			</Uploader>
			<Download :disabled="!Studio.project" type="bps" ref="bps" @download="notify">
				<Hotkey icon="fas fa-download" ctrl hk="S">{{ $t('toolbar.file.BPS.download') }}</Hotkey>
			</Download>
			<Download :disabled="!Studio.project" type="bpz" ref="bpz" @download="notifyAll">
				<Hotkey icon="fas fa-download">{{ $t('toolbar.file.BPZ.download') }}</Hotkey>
			</Download>
		</template>

		<Divider />

		<template v-if="isFileApiEnabled">
			<SaveAs :disabled="!Studio.project" type="svg" @save="svgSaved" :desc="$t('toolbar.file.SVG.name')"
					mime="image/svg+xml">
				<i class="far fa-file-image" />
				{{ $t('toolbar.file.SVG.save') }}
			</SaveAs>
			<SaveAs :disabled="!Studio.project" type="png" @save="pngSaved" :desc="$t('toolbar.file.PNG.name')" mime="image/png">
				<i class="far fa-file-image" />
				{{ $t('toolbar.file.PNG.save') }}
			</SaveAs>
		</template>
		<template v-else>
			<Download :disabled="!Studio.project" type="svg" ref="svg" @download="svgSaved">
				<i class="far fa-file-image" />{{ $t('toolbar.file.SVG.download') }}
			</Download>
			<Download :disabled="!Studio.project" type="png" ref="png" @download="pngSaved">
				<i class="far fa-file-image" />{{ $t('toolbar.file.PNG.download') }}
			</Download>
		</template>

		<DropdownItem @click="copyPNG" :disabled="!Studio.project" v-if="copyEnabled">
			<i class="far fa-copy" />{{ $t('toolbar.file.PNG.copy') }}
		</DropdownItem>
		<Divider />
		<DropdownItem @click="print" :disabled="!Studio.project">
			<Hotkey icon="fas fa-print" ctrl hk="P">{{ $t('toolbar.file.print') }}</Hotkey>
		</DropdownItem>
		<DropdownItem @click="show('share')" :disabled="!Studio.project">
			<i class="fas fa-share-alt" />{{ $t('toolbar.file.share') }}
		</DropdownItem>
	</Dropdown>
</template>

<script lang="ts">
	export default { name: "FileMenu" };
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import Workspace from "app/services/workspaceService";
	import Studio from "app/services/studioService";
	import HotKeyService from "app/services/hotkeyService";
	import { isFileApiEnabled, copyEnabled } from "app/shared/constants";
	import Import from "app/services/importService";
	import { compRef } from "app/inject";
	import Handles from "app/services/handleService";
	import Export from "app/services/exportService";
	import { Divider, Dropdown, DropdownItem } from "@/gadgets/menu";
	import Hotkey from "@/gadgets/menu/hotkey.vue";
	import { Download, Uploader, Opener, SaveAs } from "@/gadgets/file";
	import { show } from "@/modals/modalFragment.vue";
	import RecentMenu from "./recentMenu.vue";

	type DownloadInstance = InstanceType<typeof Download>;
	type SaveAsInstance = InstanceType<typeof SaveAs>;

	const opn = shallowRef<Executor>();
	const bps = shallowRef<Executor>();
	const bpz = shallowRef<Executor>();
	const svg = compRef(Download);
	const png = compRef(Download);
	const menu = compRef(Dropdown);

	onMounted(() => {
		HotKeyService.register(() => {
			// Generally speaking, the Dropdown component will only be initialized when it is pressed for the first time,
			// but the opn element is an exception, because it provides the function of the shortcut key Ctrl + O,
			// and this shortcut key may be pressed before opening the menu for the first time.
			// At this point we need to manually initialize the menu in order to use the function of this component.
			if(opn.value) {
				opn.value.execute();
			} else {
				menu.value!.init();
				Vue.nextTick(() => opn.value!.execute());
			}
		}, "o");
		HotKeyService.register(() => {
			if(!Studio.project) return;
			if(isFileApiEnabled) save();
			else bps.value!.execute();
		}, "s");
		HotKeyService.register(() => Studio.project && bps.value!.execute(), "s", true); // Save as
		HotKeyService.register(saveAll, "k");
		HotKeyService.register(print, "p");
	});

	function notify(handle: FileSystemFileHandle): void {
		// let design = this.bp.design!;
		// this.bp.notifySave(design);
		// core.handles.set(design.id, handle);
		// core.handles.addRecent(handle);
		gtag("event", "project_bps");
	}
	function notifyAll(handle?: FileSystemFileHandle): void {
		// this.bp.notifySaveAll();
		// if(handle) core.handles.addRecent(handle);
		gtag("event", "project_bpz");
	}
	function svgSaved(): void {
		gtag("event", "project_svg");
	}
	function pngSaved(): void {
		gtag("event", "project_png");
	}

	function copyPNG(): void {
		// this.bp.copyPNG();
		gtag("event", "share", { method: "copy", content_type: "image" });
	}

	function downloads(): DownloadInstance[] {
		if(isFileApiEnabled) return [];
		return [bps.value!, bpz.value!, svg.value!, png.value!] as DownloadInstance[];
	}
	function init(): void {
		// Generate ObjectURL when the menu is opened
		downloads().forEach(d => d.getFile());
	}
	function reset(): void {
		// Recycle all ObjectURLs when the menu is closed
		downloads().forEach(d => d.reset());
	}

	async function save(id?: number): Promise<boolean> {
		if(id === undefined) id = Studio.project!.id as number;
		const proj = Workspace.getProject(id)!;
		try {
			const handle = Handles.get(id);
			const writable = await handle.createWritable();
			try {
				await handle.getFile();
				await writable.write(await Export.toBPS(proj));
				await writable.close();
				Handles.addRecent(handle);
				proj.history.notifySave();
				return true;
			} catch(e) {
				await writable.abort();
				throw e;
			}
		} catch(e) {
			// If any form of failure occurs (handle not found, no write permission...), then save it as a new file
			return (bps.value! as SaveAsInstance).execute(proj, handle => {
				Handles.set(id!, handle);
				Handles.addRecent(handle);
				proj.history.notifySave();
			});
		}
	}

	async function saveAll(): Promise<void> {
		const tasks: Promise<boolean>[] = [];
		for(const id of Workspace.ids) tasks.push(save(id));
		await Promise.all(tasks); // The failure to save individual files will not affect the saving of other files
		gtag("event", "project_bps");
	}

	async function upload(files: FileList): Promise<void> {
		await Import.openFiles(files);
	}

	function open(handles: FileHandleList): void {
		Import.open(handles);
	}

	function print(): void {
		const PRINT_DELAY = 500;
		if(!Studio.project) return;
		// this.bp.onBeforePrint();
		setTimeout(window.print, PRINT_DELAY);
		gtag("event", "print", {});
	}

</script>
