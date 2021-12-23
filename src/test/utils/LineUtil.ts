import { Line } from "bp/math";

export namespace LineUtil {

	export function signature(lines: readonly Line[]): string {
		return lines.map(l => l.toString()).sort().join(";");
	}
}
