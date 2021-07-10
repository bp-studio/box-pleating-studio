<template>
	<div class="welcome fade" :class="{'shift-down':core.designs.length,'show':visible}">
		<div class="h-100 d-flex text-center align-items-center">
			<div style="font-size:10rem; font-size:min(15vh,15vw); color:gray; flex-grow:1;">
				<i class="bp-spinner fa-spin"></i>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class Spinner extends Vue {
		protected get core(): typeof core { return core; }

		protected loading = false;

		mounted(): void { core.loader = this; }

		protected get visible(): boolean {
			const FADE_TIME = 160;
			let visible = !core.initialized || this.loading;
			if(!visible) setTimeout(() => (this.$el as HTMLElement).style.display = "none", FADE_TIME);
			return visible;
		}

		public show(): Promise<void> {
			const ONE_SECOND = 1000;
			this.loading = true;

			/**
			 * 在 Safari 裡面，如果沒有等候到動畫畫面渲染完畢就繼續執行 JavaScript，
			 * 結果就是動畫永遠不會出現。用 setTimeout 來延遲當然是一個辦法，
			 * 但是我們並無法精確知道要延遲多久才夠，而且對其它瀏覽器來說也是不必要的等候，
			 * 因此這邊我設置一個 Promise 來確定動畫開始，然後才繼續下一個步驟。
			 */
			return new Promise<void>(resolve => {
				// 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
				setTimeout(() => resolve(), ONE_SECOND);
				this.$el.addEventListener("animationstart", () => resolve(), { once: true });
				(this.$el as HTMLElement).style.display = "block";
			});
		}

		public hide(): void {
			this.loading = false;
		}
	}
</script>

<style>
	.welcome.fade:not(.show) {
		pointer-events: none;
	}
</style>
