import type { CoreError } from "shared/json/project";
import type { UpdateModel } from "core/service/updateModel";
import type { RouteMap } from "./routes";

type ToPromise<T> = T extends (...args: infer U) => infer R ? (...args: U) => Promise<R> : never;

type Controller<C> = {
	readonly [A in keyof C]: ToPromise<C[A]>;
};

export type Route = {
	readonly [C in keyof RouteMap]: Controller<RouteMap[C]>;
};

export interface CoreRequest {
	controller: keyof RouteMap;
	action: string;
	value: unknown[];
}

interface ValueResponse {
	value: unknown;
}

interface UpdateResponse {
	update: UpdateModel;
}

/** Represents an unknown error had occurred. */
export interface ErrorResponse {
	error: CoreError;
}

export type CoreResponse = ValueResponse | UpdateResponse | ErrorResponse;
