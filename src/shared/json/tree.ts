
/** Type alias for node ids. */
export type NodeId = TypedNumber<"NodeId">;

export interface JEdgeBase {
	n1: NodeId;
	n2: NodeId;
}

export interface JEdge extends JEdgeBase {
	length: number;
}

/** First entry represents whether this is adding edges. */
export type JEdit = [boolean, JEdge];
