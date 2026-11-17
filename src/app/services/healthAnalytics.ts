import Analytics from "./analyticsService";
import { GA_PARAM_LENGTH, splitData } from "app/utils/analyticsUtility";

import type { Project } from "client/project/project";
import type { HealthReport } from "core/design/health";

/** The maximal number of unsolved stretches reported in a session. */
const MAX_UNSOLVED_REPORTS = 10;

/** The number of parameters for an unsolved stretch (`data1` ~ `data3`). */
const UNSOLVED_PARAMS = 3;

/** See {@link HealthAnalytics.$result}. */
const UNSOLVED_DELAY = 2000;

/** The unsolved stretches reported in this session. */
const reportedUnsolved = new Set<string>();

const enum HealthState {
	/** The next result is the first one after enabling. */
	first,
	/** The first result has issues, and they are not all resolved yet. */
	resolve,
	/** Nothing more to report. */
	none,
}

/** The kinds of the issues in the report, in the same keys as in the UI. */
function getIssues(report: HealthReport): string[] {
	const g = report.geometry;
	const counts: [string, number][] = [
		["invalid", report.invalidJunctions],
		["unsolved", report.unsolvedStretches],
		["uncovered", g?.uncovered.length ?? 0],
		["dangling", g?.danglingRidgeEnds.length ?? 0],
		["riverCorner", g?.missingRiverRidges.length ?? 0],
	];
	return counts.filter(([, n]) => n).map(([key]) => key);
}

//=================================================================
/**
 * {@link HealthAnalytics} manages the analytics of the health check of a
 * project. It is separated from {@link Analytics} only for the file size.
 */
//=================================================================
export class HealthAnalytics {

	private readonly _project: Project;

	/** The latest report, or `null` if the check is disabled. */
	private readonly _getReport: () => HealthReport | null;

	private _state: HealthState = HealthState.first;
	private _timer: number | undefined;

	constructor(project: Project, getReport: () => HealthReport | null) {
		this._project = project;
		this._getReport = getReport;
	}

	/** Called when the check is enabled or disabled. */
	public $toggle(enabled: boolean): void {
		if(enabled) this._state = HealthState.first;
		else clearTimeout(this._timer);
	}

	/**
	 * Report the first result after enabling, and the first time all the
	 * issues are resolved after that, so that we know what issues the
	 * users encounter, and how often the check helps them fix the layouts.
	 * The results in between are not reported, as the check is performed
	 * on every change of the layout, except for the unsolved stretches.
	 */
	public $result(report: HealthReport): void {
		const issues = getIssues(report);
		if(this._state == HealthState.first) {
			Analytics.event("health_result", {
				data1: issues.length ? "issues" : "pass",
				data2: issues.join(","),
			});
			this._state =
				issues.length ? HealthState.resolve : HealthState.none;
		} else if(this._state == HealthState.resolve && !issues.length) {
			Analytics.event("health_resolved");
			this._state = HealthState.none;
		}
		this._scheduleUnsolved();
	}

	/**
	 * Report the unsolved stretches once the layout stays unchanged for
	 * {@link UNSOLVED_DELAY} after dragging, so that the transient ones
	 * during the adjustments are skipped, as they don't reflect what the
	 * users want to fold. Note that there might be no more check after
	 * dragging, so we keep waiting instead of skipping the results during
	 * dragging.
	 */
	private _scheduleUnsolved(): void {
		clearTimeout(this._timer);
		this._timer = setTimeout(() => {
			const report = this._getReport();
			if(this._project.$isDragging) this._scheduleUnsolved();
			else if(report) sendUnsolved(report);
		}, UNSOLVED_DELAY);
	}
}

/**
 * Report each new unsolved stretch, so that we know which patterns are
 * most wanted. They are given as minimal trees, and the same structures in
 * different designs result in the same strings.
 *
 * The data is `edges;flaps`, which can be passed directly to `parseTree`
 * (in the tests or in the console). As each parameter is limited to
 * {@link GA_PARAM_LENGTH} characters, the data is split into
 * {@link UNSOLVED_PARAMS} parameters, enough for about 10 flaps.
 */
function sendUnsolved(report: HealthReport): void {
	for(const { edges, flaps } of report.unsolvedTrees) {
		if(reportedUnsolved.size >= MAX_UNSOLVED_REPORTS) return;
		const data = edges + ";" + flaps;
		if(reportedUnsolved.has(data)) continue;
		reportedUnsolved.add(data);
		Analytics.event(
			"health_unsolved",
			splitData(data, GA_PARAM_LENGTH, UNSOLVED_PARAMS)
		);
	}
}
