
export interface JEdgeBase {
	n1: number;
	n2: number;
}

export interface JEdge extends JEdgeBase{
	length: number;
	selected?: boolean;
}

export interface JNode {
	id: number;
	parentId?: number;
}

export type JTreeElement = JNode | JEdge;
