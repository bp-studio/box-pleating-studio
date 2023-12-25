import type { Intersector } from "./intersector";
import type { EndEvent, StartEvent } from "./event";
import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";

/** Allowing composition of {@link EndEvent} processing logic. */
export interface IEndProcessor {
	(
		event: EndEvent,
		status: IBinarySearchTree<StartEvent>,
		intersector: Intersector
	): StartEvent;
}

export const simpleEndProcessor: IEndProcessor = function(event, status) {
	const start = event.$other;
	status.$delete(start);
	return start;
};

export const generalEndProcessor: IEndProcessor = function(event, status, intersector) {
	const start = event.$other;
	const prev = status.$getPrev(start);
	const next = status.$getNext(start);
	status.$delete(start);

	// Need to check intersections after an EndEvent
	intersector.$possibleIntersection(prev, next);

	return start;
};
