import { CreaseType } from "shared/types/cp";

import type { CPLine, GenericCPLine, HingeExport } from "shared/types/cp";

/**
 * Apply the option of exporting the hinges to the generic CP. In case the
 * hinges are omitted (typically because the CP editor doesn't support the
 * auxiliary lines), the other auxiliary lines (i.e. the creases whose types
 * cannot be determined) are omitted as well.
 */
export function applyHingeExport(
	lines: readonly GenericCPLine[], hinge: HingeExport
): CPLine[] {
	const result: CPLine[] = [];
	for(const { type, p1, p2, hinge: isHinge } of lines) {
		if(hinge == "none" && type == CreaseType.Auxiliary) continue;
		const valley = isHinge && hinge == "valley";
		result.push({ type: valley ? CreaseType.Valley : type, p1, p2 });
	}
	return result;
}
