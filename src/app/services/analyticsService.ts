import { isTouch } from "app/shared/constants";
import { useThrottle } from "app/utils/timerUtility";
import {
	ActivityClock, GA_PARAM_LENGTH, createStore, deviceSpec, diffHotkeys,
	getLevel, percentile, splitData
} from "app/utils/analyticsUtility";

import type { AnalyticsStore, Milestone } from "app/utils/analyticsUtility";
import type { Project } from "client/project/project";
import type { Design } from "client/project/design";
import type { Layout } from "client/project/components/layout/layout";
import type { KeyStore } from "app/services/customHotkeyService";
import type { OptimizerOptions } from "client/plugins/optimizer";

const STORAGE_KEY = "analytics";

/** Active time shorter than this is not worth a summary. */
const MIN_SUMMARY_SEC = 10;

/** The flap count of a big design. */
const BIG_DESIGN_FLAPS = 20;

/** The active time on a big design for the advanced level. */
const BIG_DESIGN_MS = 600000;

/** Repeated inputs within this time are counted as one, if requested. */
const BURST_MS = 500;

/** The maximal number of frame intervals kept in a period. */
const MAX_FRAMES = 20000;

/** The number of parameters for the customized hotkeys. */
const HOTKEY_PARAMS = 3;

const MS_PER_SEC = 1000;
const SEC_PER_MIN = 60;
const P50 = 50;
const P95 = 95;

/** How a project is created or opened, reported in `ms_project`. */
export type ProjectSource =
	"new" | "file" | "share" | "treemaker" | "recover";

/**
 * The current project. It is accessed through the global Client instead of
 * importing the Client modules, which would break the SSG.
 */
function currentProject(): Project | null {
	return typeof bp == "undefined" ? null : bp.projects.current.value;
}

function countUnsolved(layout: Layout): number {
	let result = 0;
	for(const stretch of layout.$stretches.values()) {
		if(!stretch.$devices.length) result++;
	}
	return result;
}

/** The number of solved stretches not using the first pattern. */
function countCustomPatterns(layout: Layout): number {
	let result = 0;
	for(const stretch of layout.$stretches.values()) {
		if(!stretch.$devices.length) continue;
		if(stretch.configIndex || stretch.patternIndex) result++;
	}
	return result;
}

function isPWA(): boolean {
	// The latter is for iOS
	return matchMedia("(display-mode: standalone)").matches ||
		(navigator as { standalone?: boolean }).standalone === true;
}

function getDeviceSpec(): string {
	// Destructured to avoid the false alarms of compat checking
	const nav = navigator as Partial<Navigator>;
	const { hardwareConcurrency, deviceMemory } = nav;
	return deviceSpec(hardwareConcurrency, deviceMemory);
}

const sec = (ms: number): number => Math.round(ms / MS_PER_SEC);

/** The data collected since the last summary. */
function createPeriod() {
	return {
		activeMs: 0,
		undo: 0,
		redo: 0,
		flapsMax: 0,
		projectsMax: 0,
		/** The active time while there are invalid junctions. */
		invalidMs: 0,
		/** The active time while there are unsolved stretches. */
		unsolvedMs: 0,
		/** The durations of the Core updates. */
		updates: [] as number[],
		/** The frame intervals during dragging. */
		frames: [] as number[],
		inputs: new Map<string, number>(),
	};
}

//=================================================================
/**
 * {@link AnalyticsService} is the only place that talks to Google Analytics
 * (except the initialization in the HTML). See `docs/analytics-plan.md` for
 * the design.
 */
//=================================================================
namespace AnalyticsService {

	let store: AnalyticsStore = createStore(false);
	const clock = new ActivityClock();
	let period = createPeriod();

	const lastBursts = new Map<string, number>();

	/** The active time on each project while it is a big design. */
	const bigDesignTime = new WeakMap<Project, number>();

	/**
	 * Load the stored state. This must be called before the `build` entry is
	 * written to the localStorage, as it is used to identify the legacy users.
	 */
	export function init(): void {
		const stored = read();
		if(stored) {
			store = stored;
		} else {
			const legacy = Boolean(
				localStorage.getItem("build") || localStorage.getItem("session")
			);
			store = createStore(legacy);
			write();
		}
		gtag("set", "user_properties", {
			user_level: store.level,
			touch: isTouch ? "yes" : "no",
			pwa: isPWA() ? "yes" : "no",
			device_spec: getDeviceSpec(),
		});
		document.addEventListener("visibilitychange", () => {
			if(document.visibilityState != "hidden") return;
			flush();
			// The time while hidden is not active
			clock.$reset();
			lastFrame = undefined;
		});
	}

	////////////////////////////////////////////////////////////////////////////
	// Plain events
	////////////////////////////////////////////////////////////////////////////

	/** Send an event as is. */
	export function event(
		name: string, params?: Gtag.EventParams | Gtag.CustomParams
	): void {
		if(params) gtag("event", name, params);
		else gtag("event", name);
	}

	/** Send an event with the error message split into the parameters. */
	export function errorEvent(name: string, error: string): void {
		gtag("event", name, gaErrorData(error));
	}

	const throttles = new Map<string, Action>();

	/** Return an action that sends the event at most once in the given time. */
	export function throttled(name: string, time: number): Action {
		let action = throttles.get(name);
		if(!action) {
			const throttle = useThrottle(time);
			action = () => throttle(() => event(name));
			throttles.set(name, action);
		}
		return action;
	}

	/**
	 * Report the customized hotkeys whenever they differ from the last report,
	 * which includes the changes made in the previous sessions. This is the
	 * most direct signal that the defaults are not convenient.
	 */
	export function hotkeys(current: KeyStore, defaults: KeyStore): void {
		const diff = diffHotkeys(current, defaults);
		if(diff == (store.hotkeys ?? "")) return;
		store.hotkeys = diff;
		write();
		event("hotkey_custom", diff ?
			splitData(diff, GA_PARAM_LENGTH, HOTKEY_PARAMS) :
			{ data1: "default" });
	}

	/** Report a finished optimization. */
	export function optimized(
		options: OptimizerOptions, flaps: number, ms: number
	): void {
		event("optimizer_done", {
			data1: options.layout,
			data2: options.useBH ? "bh" : "none",
			opt_flaps: flaps,
			opt_sec: sec(ms),
		});
	}

	////////////////////////////////////////////////////////////////////////////
	// Usage tracking
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Record an input of the given task by the given method, which also counts
	 * as an activity.
	 * @param burst Whether repeated calls within a short time (such as wheel
	 * events of one gesture) are counted as one.
	 */
	export function input(task: string, method: string, burst?: boolean): void {
		activity();
		const key = task + "." + method;
		if(burst) {
			const now = performance.now();
			const last = lastBursts.get(key);
			lastBursts.set(key, now);
			if(last !== undefined && now - last < BURST_MS) return;
		}
		period.inputs.set(key, (period.inputs.get(key) ?? 0) + 1);
	}

	/** Record an activity for measuring the active time. */
	export function activity(): void {
		const ms = clock.$tick(performance.now());
		period.activeMs += ms;
		store.activeSec += ms / MS_PER_SEC;

		const project = currentProject();
		if(!project) return;
		const layout = project.design.layout;
		const flaps = layout.flapCount;
		if(flaps > period.flapsMax) period.flapsMax = flaps;
		if(flaps >= BIG_DESIGN_FLAPS) {
			bigDesignTime.set(project, (bigDesignTime.get(project) ?? 0) + ms);
		}
		if(layout.invalidCount) period.invalidMs += ms;
		if(countUnsolved(layout)) period.unsolvedMs += ms;
	}

	export function undo(): void {
		activity();
		period.undo++;
	}

	export function redo(): void {
		activity();
		period.redo++;
	}

	/** Record the duration of a Core update. */
	export function coreUpdate(ms: number): void {
		period.updates.push(ms);
	}

	/** Record the number of opened projects. */
	export function projectCount(count: number): void {
		if(count > period.projectsMax) period.projectsMax = count;
	}

	let frameHandle: number | undefined;
	let lastFrame: number | undefined;

	/**
	 * Start measuring the frame intervals, which reflect the smoothness that
	 * the users actually feel, including the rendering.
	 */
	export function dragStart(): void {
		if(frameHandle !== undefined) return;
		lastFrame = undefined;
		frameHandle = requestAnimationFrame(onFrame);
	}

	function onFrame(now: number): void {
		const frames = period.frames;
		if(lastFrame !== undefined && frames.length < MAX_FRAMES) {
			frames.push(now - lastFrame);
		}
		lastFrame = now;
		frameHandle = requestAnimationFrame(onFrame);
	}

	export function dragEnd(): void {
		if(frameHandle === undefined) return;
		cancelAnimationFrame(frameHandle);
		frameHandle = undefined;
	}

	////////////////////////////////////////////////////////////////////////////
	// Milestones and levels
	////////////////////////////////////////////////////////////////////////////

	/** Report a milestone, once for each user. */
	export function milestone(name: Milestone, data1?: string): void {
		if(store.level == "legacy" || store.milestones.includes(name)) return;
		store.milestones.push(name);
		event("ms_" + name, {
			active_min: Math.round(store.activeSec / SEC_PER_MIN),
			...data1 ? { data1 } : {},
		});
		updateLevel();
		write();
	}

	/** Report the milestone of creating or opening a project. */
	export function projectOpened(source: ProjectSource): void {
		milestone("project", source);
	}

	/** Check the milestones about the layout after it is updated. */
	export function layoutUpdated(layout: Layout): void {
		if(!layout.$stretches.size) return;
		if(!layout.invalidCount) milestone("valid");
		for(const stretch of layout.$stretches.values()) {
			if(stretch.$devices.length) return milestone("pattern");
		}
	}

	/** Check the milestone of entering the layout mode. */
	export function modeChanged(design: Design): void {
		const MIN_FLAPS = 2;
		if(design.mode == "layout" && design.layout.flapCount >= MIN_FLAPS) {
			milestone("layout");
		}
	}

	/** Called when a project is saved or exported. */
	export function saved(project: Project | null): void {
		milestone("save");
		const bigDesign = project ?
			(bigDesignTime.get(project) ?? 0) >= BIG_DESIGN_MS : false;
		updateLevel(bigDesign);
		write();
	}

	function updateLevel(bigDesign: boolean = false): void {
		const level = getLevel(store, bigDesign);
		if(level == store.level) return;
		store.level = level;
		gtag("set", "user_properties", { user_level: level });
	}

	////////////////////////////////////////////////////////////////////////////
	// Summary
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Send the summary of the period since the last summary. Inputs are kept
	 * until the period is long enough.
	 */
	function flush(): void {
		updateLevel();
		write();
		const p = period;
		if(p.activeMs < MIN_SUMMARY_SEC * MS_PER_SEC) return;

		const beacon = { transport_type: "beacon" };
		gtag("event", "session_summary", {
			...beacon,
			...getExitState(),
			active_sec: sec(p.activeMs),
			undo: p.undo,
			redo: p.redo,
			upd_count: p.updates.length,
			upd_p50: Math.round(percentile(p.updates, P50)),
			upd_p95: Math.round(percentile(p.updates, P95)),
			frame_p50: Math.round(percentile(p.frames, P50)),
			frame_p95: Math.round(percentile(p.frames, P95)),
			flaps_max: p.flapsMax,
			projects_max: p.projectsMax,
			invalid_sec: sec(p.invalidMs),
			unsolved_sec: sec(p.unsolvedMs),
		});
		for(const [key, count] of p.inputs) {
			gtag("event", "input_usage", { ...beacon, data1: key, count });
		}
		period = createPeriod();
	}

	function getExitState(): Record<string, string | number> {
		const idle = sec(clock.$idle(performance.now()));
		const project = currentProject();
		if(!project) return { data1: "none", exit_idle_sec: idle };
		const { mode, layout } = project.design;
		return {
			data1: mode,
			exit_flaps: layout.flapCount,
			exit_invalid: layout.invalidCount,
			exit_stretches: layout.$stretches.size,
			exit_unsolved: countUnsolved(layout),
			exit_custom: countCustomPatterns(layout),
			exit_idle_sec: idle,
		};
	}

	function read(): AnalyticsStore | undefined {
		try {
			const json = localStorage.getItem(STORAGE_KEY);
			if(!json) return undefined;
			const result = JSON.parse(json) as AnalyticsStore;
			const valid = typeof result.activeSec == "number" &&
				Array.isArray(result.milestones) && typeof result.level == "string";
			return valid ? result : undefined;
		} catch {
			return undefined;
		}
	}

	function write(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
		} catch {
			// Not critical
		}
	}
}

export default AnalyticsService;
