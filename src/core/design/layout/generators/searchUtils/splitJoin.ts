import { clone } from "shared/utils/clone";
import { quadrantNumber } from "shared/types/direction";
import { CornerType } from "shared/json/enum";

import type { JointItem } from "./types";
import type { NodeId } from "shared/json/tree";
import type { JPartition } from "shared/json/pattern";
import type { Configuration } from "../../configuration";
import type { JOverlap, OverlapId } from "shared/json/layout";

export interface SplitItem {
	/** The {@link JOverlap} to be joined. */
	readonly overlap: JOverlap;

	readonly oppositeNodeId: NodeId;

	/** Info about the splitting, if applicable. */
	split?: {
		/** The remaining {@link JPartition}. */
		remainingPartition: JPartition;

		/** Whether the splitting is horizontal (i.e. the two parts have the same width). */
		isHorizontal: boolean;
	};
}

export function cover(o1: JOverlap, o2: JOverlap): boolean {
	return o1.ox >= o2.ox && o1.oy >= o2.oy;
}

export function toSplitItems(item: JointItem, nodeId: NodeId): SplitItem[] {
	return item.configs.map(config => toSplitItem(config, nodeId, item.oppositeNodeId));
}

function toSplitItem(config: Configuration, nodeId: NodeId, oppositeNodeId: NodeId): SplitItem {
	const partitions = config.$rawPartitions;
	const overlaps = partitions.map(p => p.overlaps[0]);
	if(partitions.length == 1) return { overlap: overlaps[0], oppositeNodeId };
	const isHorizontal = overlaps[0].ox == overlaps[1].ox;

	const p = partitions.find(partition => {
		const overlap = partition.overlaps[0];
		return overlap.c[0].e == nodeId || overlap.c[2].e == nodeId;
	})!;
	const remainingPartition = partitions.find(partition => partition != p);
	const overlap = p.overlaps[0];
	return { overlap, oppositeNodeId, split: { remainingPartition, isHorizontal } } as SplitItem;
}

export function getExposedPart(item: SplitItem, against: SplitItem, join: JPartition): JPartition | undefined {
	if(!item.split) return;
	const itemIsTaller = item.overlap.oy > against.overlap.oy;
	const isHorizontal = item.split.isHorizontal;
	const splittingOnOutside = itemIsTaller == isHorizontal;
	const result = clone(item.split.remainingPartition);
	if(!splittingOnOutside) {
		if(isHorizontal) {
			result.overlaps[0].ox -= against.overlap.ox;
		} else {
			result.overlaps[0].oy -= against.overlap.oy;
		}
		for(const i of [0, 1]) {
			const overlap = join.overlaps[i];
			for(let q = 0; q < quadrantNumber; q++) {
				if(overlap.c[q].type == CornerType.intersection) {
					const overlapIsSelf = overlap.parent == item.overlap.parent;
					replaceIntersectionCorner(
						result.overlaps[0], overlap, q,
						overlapIsSelf ? overlap.id! : join.overlaps[1 - i].id!,
						against.oppositeNodeId
					);
				}
			}
		}
	}
	return result;
}

function replaceIntersectionCorner(
	from: JOverlap, to: JOverlap, q: number, socketOverlapId: OverlapId, againstFlapId: NodeId
): void {
	const overlapIsSelf = socketOverlapId == to.id;
	const target = to.c[q];
	const q_ = overlapIsSelf ? q : quadrantNumber - q;
	const source = from.c[q_];
	source.type = CornerType.intersection;
	if(overlapIsSelf) {
		source.e = target.e;
	} else {
		source.e = againstFlapId;
	}
	target.type = CornerType.socket;
	target.e = from.id;
	for(const [i, c] of from.c.entries()) {
		if(c.type == CornerType.internal && c.e == socketOverlapId) {
			target.q = i;
			c.e = to.id;
			c.q = q;
		}
	}
}
