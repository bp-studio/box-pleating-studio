export interface JEdge {
	n1: number;
	n2: number;
	length: number;
	selected?: boolean;
}

export interface JNode {
	id: number;
	parentId?: number;
}

export type JTreeElement = JNode | JEdge;
