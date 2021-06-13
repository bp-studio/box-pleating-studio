<template>
	<div></div>
</template>

<script lang="ts">

	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { bp } from './import/BPStudio';
	import { core } from './core.vue';

	declare const gtag: any;

	@Component
	export default class Projects extends Vue {

		@Prop(Array) public designs: number[];

		public create() {
			let j = { title: this.$t('keyword.untitled') };
			let d = bp.create(this.checkTitle(j));
			this.add(bp.design = d);
			this.scrollTo(d.id);
		}

		public select(id: number) {
			bp.select(id);
			let i = this.tabHistory.indexOf(id);
			if(i >= 0) this.tabHistory.splice(i, 1);
			this.tabHistory.unshift(id);
			this.scrollTo(id);
		}

		public async close(id?: number) {
			if(id === undefined) id = bp.design.id;
			if(await this.closeCore(id)) this.selectLast();
		}

		public async closeOther(id: number) {
			await this.closeBy(i => i != id);
		}

		public async closeRight(id: number) {
			await this.closeBy(i => this.designs.indexOf(i) > this.designs.indexOf(id));
		}

		public async closeAll() {
			await this.closeBy(i => true);
		}

		public clone(id?: number) {
			if(id === undefined) id = bp.design.id;
			let i = this.designs.indexOf(id);
			let d = bp.getDesign(id).toJSON(true);
			let c = bp.restore(this.checkTitle(d));
			this.designs.splice(i + 1, 0, c.id);
			this.select(c.id);
			gtag('event', 'project_clone');
		}

		public add(d: Design, select = true) {
			this.designs.push(d.id);
			if(select) this.select(d.id);
			else this.tabHistory.unshift(d.id);
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		// 私有成員
		/////////////////////////////////////////////////////////////////////////////////////////

		private tabHistory: number[] = [];

		private scrollTo(id: number) {
			Vue.nextTick(() => {
				let el = document.getElementById(`tab${id}`);
				if(el) el.scrollIntoView({
					behavior: "smooth",
					inline: "end"
				});
			});
		}

		private checkTitle(j: any) {
			let t = j.title.replace(/ - \d+$/, ""), n = 1;
			let designs = bp.getDesigns();
			if(!designs.some(d => d.title == t)) return j;
			while(designs.some(d => d.title == t + " - " + n)) n++;
			j.title = t + " - " + n;
			return j;
		}

		private async closeBy(predicate: (i: number) => boolean) {
			let promises: Promise<boolean>[] = [];
			for(let i of this.designs.concat()) if(predicate(i)) promises.push(this.closeCore(i));
			await Promise.all(promises);
			this.selectLast();
		}

		private async closeCore(id: number): Promise<boolean> {
			let d = bp.getDesign(id)!;
			let title = d.title || this.$t("keyword.untitled");
			if(bp.isModified(d)) {
				this.select(id);
				let message = this.$t("message.unsaved", [title]);
				if(!(await core.confirm(message))) return false;
			}
			this.designs.splice(this.designs.indexOf(id), 1);
			this.tabHistory.splice(this.tabHistory.indexOf(id), 1);
			bp.close(id);
			return true;
		}

		private selectLast(): void {
			bp.select(this.tabHistory.length ? this.tabHistory[0] : null);
			bp.update();
		}
	}

</script>
