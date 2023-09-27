export function toHex(color: number): string {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	return "#" + color.toString(16).padStart(6, "0");
}
