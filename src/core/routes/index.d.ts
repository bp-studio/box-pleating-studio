import type { UpdateModel } from "core/service/updateModel";
import type { RouteMap } from "./routes";

type ToPromise<T> = (...args: Parameters<T>) => Promise<ReturnType<T>>;
type Controller<C extends keyof RouteMap> = {
	readonly [A in keyof RouteMap[C]]: ToPromise<RouteMap[C][A]>;
};

export type Route = {
	readonly [C in keyof RouteMap]: Controller<C>;
};

export interface IStudioRequest {
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
interface ErrorResponse {
	error: string;
}

export type StudioResponse = ValueResponse | UpdateResponse | ErrorResponse;
