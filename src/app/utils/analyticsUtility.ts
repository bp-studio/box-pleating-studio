// The pure logics of AnalyticsService, separated for testing.

/** See docs/analytics-plan.md for the definitions. */
export type UserLevel = "new" | "regular" | "advanced" | "legacy";

export const MILESTONES = ["project", "tree_edit", "layout", "valid", "pattern", "save"] as const;

export type Milestone = typeof MILESTONES[number];

/** The analytics state persisted in the localStorage. */
export interface AnalyticsStore {
	/** The accumulated active time in seconds. */
	activeSec: number;
	milestones: Milestone[];
	level: UserLevel;
	/** The last reported customized hotkeys; see {@link diffHotkeys}. */
	hotkeys?: string;
}

/** The maximal length of a parameter value in Google Analytics. */
export const GA_PARAM_LENGTH = 100;

/** The active time below which a user is considered new (1 hour). */
const NEW_USER_SEC = 3600;

/** The active time above which a user is considered advanced (10 hours). */
const ADVANCED_USER_SEC = 36000;

/**
 * The maximal gap between two activities that counts as active time.
 * Longer gaps are counted as this value.
 */
export const IDLE_CAP = 60000;

/** Create the initial store, given whether the user is a legacy user. */
export function createStore(legacy: boolean): AnalyticsStore {
	return { activeSec: 0, milestones: [], level: legacy ? "legacy" : "new" };
}

/**
 * Determine the level of the user. The level never goes down, except that a
 * legacy user can only become advanced.
 * @param bigDesign Whether the condition of working on a big design is met.
 */
export function getLevel(store: AnalyticsStore, bigDesign: boolean): UserLevel {
	const { level, activeSec, milestones } = store;
	if(level == "advanced" || bigDesign || activeSec >= ADVANCED_USER_SEC) {
		return "advanced";
	}
	if(level != "new") return level;
	const passed = milestones.length == MILESTONES.length;
	return activeSec < NEW_USER_SEC && !passed ? "new" : "regular";
}

/**
 * Measure the active time. Each activity credits the time since the last
 * activity, capped at {@link IDLE_CAP}.
 */
export class ActivityClock {

	private _last: number | undefined;

	/** Record an activity at the given time, and return the credited time. */
	public $tick(now: number): number {
		const last = this._last;
		this._last = now;
		if(last === undefined) return 0;
		return Math.min(now - last, IDLE_CAP);
	}

	/** The time since the last activity, or 0 if there has been none. */
	public $idle(now: number): number {
		return this._last === undefined ? 0 : now - this._last;
	}

	/**
	 * Forget the last activity, so that the time until the next activity is
	 * not counted (used when the page is hidden).
	 */
	public $reset(): void {
		this._last = undefined;
	}
}

const PERCENT = 100;

/** The given percentile of the values, using the nearest-rank method. */
export function percentile(values: readonly number[], p: number): number {
	if(!values.length) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const rank = Math.ceil(p / PERCENT * sorted.length);
	return sorted[Math.max(rank, 1) - 1];
}

type HotkeyMap = Record<string, Record<string, string>>;

/**
 * List the hotkeys that differ from the defaults, in the format of
 * `m.u=I m.d=K`, where an empty key means the command is unbound.
 * The commands are separated by spaces, as the key itself can be any printable
 * character other than the space.
 */
export function diffHotkeys(current: HotkeyMap, defaults: HotkeyMap): string {
	const result: string[] = [];
	for(const name in defaults) {
		for(const command in defaults[name]) {
			const key = current[name]?.[command] ?? defaults[name][command];
			if(key == defaults[name][command]) continue;
			result.push(`${name}.${command}=${key == "\t" ? "Tab" : key}`);
		}
	}
	return result.join(" ");
}

/**
 * A rough description of the device, such as `8c8g` for 8 logical processors
 * and 8 GB of memory. The memory is unknown (`?`) in non-Chromium browsers,
 * and the values are rounded by the browsers for privacy.
 */
export function deviceSpec(
	cores: number | undefined, memory: number | undefined
): string {
	return `${cores ?? "?"}c${memory ?? "?"}g`;
}

/**
 * Split a string into the parameters `data1`, `data2`, etc., as each
 * parameter in Google Analytics is limited to `length` characters.
 * The part beyond `count` parameters is dropped.
 */
export function splitData(
	data: string, length: number, count: number
): Record<string, string> {
	const result: Record<string, string> = {};
	for(let i = 0; i < count; i++) {
		const chunk = data.slice(i * length, (i + 1) * length);
		if(chunk) result["data" + (i + 1)] = chunk;
	}
	return result;
}
