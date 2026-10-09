<template>
	<div
		v-if="report"
		id="divHealth"
		class="card text-white shadow bg-opacity-75"
		:class="'bg-' + level"
	>
		<div class="d-flex align-items-center px-3 py-2">
			<i class="me-2" :class="icon"/>
			<span class="flex-grow-1">{{ summary }}</span>
			<button type="button" class="btn btn-sm text-white ms-2" @click="expanded = !expanded">
				<i :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"/>
			</button>
		</div>
		<div v-if="expanded" class="px-3 pb-2">
			<div v-for="item in items" :key="item.title" class="mb-2">
				<div v-if="item.title" class="fw-bold">{{ item.title }}</div>
				<div>{{ item.detail }}</div>
			</div>
			<a
				class="text-white"
				:href="`https://bp-studio.github.io/${l}manual.html#health-check`"
				target="_blank"
				@click="learnMore"
			>
				{{ $t("health.learnMore") }}
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, shallowRef } from "vue";

	import Studio from "app/services/studioService";

	import type { Health } from "client/project/components/layout/health";

	defineOptions({ name: "Health" });

	type HealthReport = NonNullable<Health["report"]>;

	interface Item {
		title: string;
		detail: string;
	}

	const expanded = shallowRef(true);

	const l = computed(() => {
		const lang = i18n.locale.value;
		if(lang == "en") return "";
		return lang.replace(/-[a-z]+/, t => t.toLocaleUpperCase()) + "/";
	});

	const report = computed<HealthReport | null>(() => {
		const design = Studio.project?.design;
		if(!design || design.mode != "layout") return null;
		return design.layout.health.report;
	});

	const level = computed(() => {
		const r = report.value!;
		if(r.invalidJunctions) return "danger";
		return count(r) || r.unsolvedStretches ? "warning" : "success";
	});

	const icon = computed(() => {
		if(level.value == "danger") return "fas fa-times-circle";
		if(level.value == "warning") return "fas fa-exclamation-triangle";
		return "fas fa-check-circle";
	});

	const summary = computed(() => {
		const r = report.value!;
		if(r.invalidJunctions) {
			return i18n.t("health.invalid") + ": " + r.invalidJunctions;
		}
		const total = r.unsolvedStretches + count(r);
		return total ? i18n.t("health.issues", [total]) : i18n.t("health.pass");
	});

	const items = computed(() => {
		const r = report.value!;
		const result: Item[] = [];
		add(result, "invalid", r.invalidJunctions);
		add(result, "unsolved", r.unsolvedStretches);
		const g = r.geometry;
		if(g) {
			add(result, "uncovered", g.uncovered.length);
			add(result, "dangling", g.danglingRidgeEnds.length);
			add(result, "riverCorner", countRivers(r));
		}
		if(!result.length) {
			result.push({ title: "", detail: i18n.t("health.passDetail") });
		}
		return result;
	});

	function learnMore(): void {
		gtag("event", "health_learn_more");
	}

	function add(list: Item[], key: string, n: number): void {
		if(!n) return;
		list.push({
			title: i18n.t("health." + key) + ": " + n,
			detail: i18n.t("health." + key + "Detail"),
		});
	}

	function countRivers(r: HealthReport): number {
		return r.geometry?.missingRiverRidges.length ?? 0;
	}

	/** The total number of geometric issues. */
	function count(r: HealthReport): number {
		const g = r.geometry;
		if(!g) return 0;
		return g.uncovered.length + g.danglingRidgeEnds.length +
			countRivers(r);
	}

</script>
