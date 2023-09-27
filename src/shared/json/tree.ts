
export interface JEdgeBase {
	n1: number;
	n2: number;
}

export interface JEdge extends JEdgeBase {
	length: number;
}

/** First entry represents whether this is adding edges. */
export type JEdit = [boolean, JEdge];
