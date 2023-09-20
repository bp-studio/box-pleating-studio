
/**
 * Convert overlap id back and forth to the index within {@link Configuration.$overlaps}.
 *
 * @param code The id/index to convert.
 * It allows the possibility of type undefined for ease of use
 * (so that type assertion is not needed),
 * but in reality one must ensure to pass in an actual number.
 */
export function convertIndex(code: number | undefined): number {
	return -code! - 1;
}
