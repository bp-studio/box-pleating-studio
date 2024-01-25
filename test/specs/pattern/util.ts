import { createTree } from "@utils/tree";
import { State } from "core/service/state";

import type { Pattern } from "core/design/layout/pattern/pattern";
import type { Configuration } from "core/design/layout/configuration";
import type { Tree } from "core/design/context/tree";
import type { Device } from "core/design/layout/pattern/device";

export function complete(): void {
	for(const stretch of State.$stretches.values()) stretch.$repo.$complete();
}

interface IFlap {
	id: number;
	x: number;
	y: number;
	radius: number;
}

export function generateFromFlaps(flaps: IFlap[]): Tree {
	return createTree(
		flaps.map(f => ({ n1: 0, n2: f.id, length: f.radius })),
		flaps.map(f => ({ id: f.id, width: 0, height: 0, x: f.x, y: f.y }))
	);
}

export function expectRepo(id: string, configCount: number): readonly Configuration[];
export function expectRepo(id: string, configCount: number, patternCount: number): readonly Pattern[];
export function expectRepo(
	id: string, configCount: number, patternCount: number, deviceCount: number
): readonly Device[];
export function expectRepo(
	id: string,
	configCount: number,
	patternCount?: number,
	deviceCount?: number
): readonly Configuration[] | readonly Pattern[] | readonly Device[] {

	complete();
	const stretch = State.$stretches.get(id)!;
	expect(stretch).to.be.not.undefined;
	expect(stretch.$repo.$configurations.length).to.equal(configCount);
	if(patternCount === undefined) return stretch.$repo.$configurations;

	const config = stretch.$repo.$configurations[0];
	expect(config.$length).to.equal(patternCount);
	if(deviceCount === undefined) return config.$patterns;

	const pattern = config.$pattern!;
	expect(pattern.$devices.length).to.equal(deviceCount);
	return pattern.$devices;
}
