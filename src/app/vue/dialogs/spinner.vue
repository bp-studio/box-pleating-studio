<template>
	<div id="divSpinner" class="viewport" :class="{ 'shift-down': Workspace.projects.length, 'show': visible }">
		<div class="h-100 d-flex text-center align-items-center">
			<div style="font-size: 10rem; font-size: min(15vh, 15vw); color: gray; flex-grow: 1;">
				<i class="bp-spinner fa-spin" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Spinner" };
</script>

<script setup lang="ts">

	import { computed, shallowRef } from "vue";

	import Core from "app/core";
	import Workspace from "app/services/workspaceService";

	const loading = shallowRef(false);
	const visible = computed(() => !Core.lcpReady || loading.value);
	const ONE_SECOND = 1000;

	function show(): Promise<void> {
		loading.value = true;

		/**
		 * 在 Safari 裡面，如果沒有等候到動畫開始就繼續執行 JavaScript，
		 * 結果就是動畫永遠不會出現。用 setTimeout 來延遲當然是一個辦法，
		 * 但是我們並無法精確知道要延遲多久才夠，而且對其它瀏覽器來說也是不必要的等候，
		 * 因此這邊我設置一個 Promise 來確定動畫開始，然後才繼續下一個步驟。
		 */
		return new Promise<void>(resolve => {
			// 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
			setTimeout(() => resolve(), ONE_SECOND);
			const el = document.getElementById("divSpinner")!;
			el.addEventListener("transitionstart", () => resolve(), { once: true });
		});
	}

	function hide(): void {
		loading.value = false;
	}

	defineExpose({
		show,
		hide,
	});

</script>

<style lang="scss">
	#divSpinner {
		visibility: hidden;

		/* 這段 CSS 的組合使得 Spinner 的出現是漸進的、但是消失是瞬間的 */
		> div {
			transition: opacity 0.5s cubic-bezier(1, 0, 0, 0);
			opacity: 0;
		}

		&.show {
			visibility: visible;

			> div {
				opacity: 1;
			}
		}
	}
</style>
