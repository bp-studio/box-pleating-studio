
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

/**
 * In order to ensure that the coordinates are in the range of [-16384, 16384),
 * we set hard limit on the sheet size to be {@link MAX_SHEET_SIZE},
 * and then we shifted the value by -{@link COORDINATE_SHIFT},
 * together with {@link MAX_TREE_HEIGHT} this achieves the goal.
 */
export const COORDINATE_SHIFT = 4096;

export const MIN_RECT_SIZE = 4; // Used to be 8, now 4.
export const MIN_DIAG_SIZE = 6;
