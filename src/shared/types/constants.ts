
import type { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";

/**
 * In practice, user's device will probably crash before reaching this limit.
 */
export const MAX_SHEET_SIZE = 8192;

/**
 * This equals `Math.ceil(8192 * Math.SQRT2))`,
 * which makes sense since that is the greatest possible distance
 * between two points on a sheet no larger than {@link MAX_SHEET_SIZE}.
 */
export const MAX_TREE_HEIGHT = 11586;

export const MIN_RECT_SIZE = 4; // Used to be 8, now 4.
export const MIN_DIAG_SIZE = 6;

/**
 * This limit comes from our implementation of {@link IntDoubleMap}.
 */
export const MAX_VERTICES = 65535;
