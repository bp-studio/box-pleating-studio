import { CornerType, JoinStrategy } from "shared/json";

import type { GadgetStrategy, JConfiguration, JDesign, JHistory, JOverlap, JPartition, JProject, JStretch } from "shared/json";

/** The format of partitions before version 0.8. */
interface LegacyPartition extends JPartition {
	strategy?: string;
}

/**
 * Version 0.8 moves the strategies from {@link JPartition}s to
 * {@link JOverlap}s, so that each join in a partition can have its own
 * strategy, and makes the strategy of simple joins explicit.
 */
export default function $process(proj: Pseudo<JProject>): boolean {
	// The design is separated since version 0.6, but the stretches could be
	// missing in older files.
	const design = proj.design as JDesign;
	for(const stretch of design.layout.stretches ?? []) {
		migrateStretch(stretch);
	}

	// The mementos of stretches in the history contain the entire stretches
	const history = proj.history as JHistory | undefined;
	for(const step of history?.steps ?? []) {
		const mementos = [...step.construct ?? [], ...step.destruct ?? []];
		for(const [tag, memento] of mementos) {
			if(tag.startsWith("s")) migrateStretch(memento as JStretch);
		}
	}

	return false;
}

function migrateStretch(stretch: JStretch): void {
	if(stretch.configuration) migrateConfiguration(stretch.configuration);
	for(const config of stretch.repo?.configurations ?? []) {
		migrateConfiguration(config);
	}
}

function migrateConfiguration(config: JConfiguration): void {
	for(const partition of config.partitions as LegacyPartition[]) {
		const { overlaps, strategy } = partition;
		if(overlaps.length == 1) {
			if(strategy) overlaps[0].gadget = strategy as GadgetStrategy;
		} else {
			// Before version 0.8, an omitted strategy means simple joins.
			const join = strategy as JoinStrategy | undefined;
			for(const o of overlaps) {
				if(isJoined(o)) o.join = join ?? JoinStrategy.simple;
			}
		}
		delete partition.strategy;
	}
}

/** See JOverlap.join. */
function isJoined(o: JOverlap): boolean {
	return o.c[0].type == CornerType.coincide ||
		o.c[2].type == CornerType.coincide;
}
