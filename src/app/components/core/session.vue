<template>
	<div></div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';
	import { bp } from '../import/BPStudio';

	/** 管理工作階段的自動儲存 */
	@Component
	export default class Session extends Vue {

		public async init(loadSession: boolean): Promise<boolean> {
			const SAVE_INTERVAL = 3000;

			/**
			 * 舊資料；過一陣子之後可以拿掉這一段程式碼
			 * @since 711 (20210112)
			 * @deprecated
			 */
			localStorage.removeItem("sessionId");
			localStorage.removeItem("sessionTime");

			// 只有擁有存檔權的實體會去讀取 session
			let haveSession = await this.checkSession();
			if(haveSession && loadSession) {
				let sessionString = localStorage.getItem("session");
				if(sessionString) {
					let session = JSON.parse(sessionString);
					let jsons = session.jsons as unknown[];
					for(let i = 0; i < jsons.length; i++) {
						let design = bp.restore(jsons[i]);
						core.projects.add(design, false);
					}
					if(session.open >= 0) core.projects.select(core.designs[session.open]);
					bp.update();
				}
			}

			window.setInterval(() => this.save(), SAVE_INTERVAL);
			window.addEventListener("beforeunload", () => this.save());

			return haveSession;
		}

		/** 檢查當前的 App 實體是否具有工作階段儲存權 */
		private checkSession(): Promise<boolean> {
			const SESSION_CHECK_TIMEOUT = 250;
			return new Promise<boolean>(resolve => {
				// 如果是本地執行就採用 Broadcast Channel 的 fallback
				if(location.protocol != "https:") {
					checkWithBC(core.id).then(ok => resolve(ok));
				} else {
					// 理論上整個檢查瞬間就能做完，所以過了 1/4 秒仍然沒有結果就視為失敗
					let cancel = setTimeout(() => resolve(false), SESSION_CHECK_TIMEOUT);
					callService("id")
						.then(
							(id: number) => resolve(core.id < id), // 最舊的實體優先
							() => resolve(true) // 沒有 Service Worker 的時候直接視為可以
						)
						.finally(() => clearTimeout(cancel));
				}
			});
		}

		/** 儲存工作階段 */
		public async save(): Promise<void> {
			// 拖曳的時候存檔無意義且浪費效能，跳過
			if(bp.isDragging) return;

			// 只有當前的實體取得存檔權的時候才會儲存
			if(core.settings.autoSave && await this.checkSession()) {
				let save = async (): Promise<void> => {
					let session = {
						jsons: core.designs.map(
							id => bp.getDesign(id)!.toJSON(true)
						),
						open: bp.design ? core.designs.indexOf(bp.design.id) : -1,
					};
					localStorage.setItem("session", JSON.stringify(session));
					await core.handles.save();
				};

				if(bp.design) {
					/**
					 * 如果 bp 正在運作中，則排程到下一次 BPStudio 更新完畢之後存檔，
					 * 避免在存檔的瞬間製造出 glitch
					 */
					bp.option.onUpdate = save;
				} else {
					// 不然直接儲存就好了
					save();
				}
			}
		}
	}

</script>
