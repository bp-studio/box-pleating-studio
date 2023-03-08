import type { UpdateModel } from "core/service/updateModel";
import type { RouteMap } from "./routes";

export type ControllerKeys = keyof RouteMap;

export type ActionKeys<T extends ControllerKeys> = keyof RouteMap[T];

export type ActionArguments<T extends ControllerKeys, U extends ActionKeys<T>> = Parameters<RouteMap[T][U]>;

export type ActionResult<T extends ControllerKeys, U extends ActionKeys<T>> = Awaited<ReturnType<RouteMap[T][U]>>;

export interface IStudioRequestBase {
	controller: ControllerKeys;
	action: string;
	value: unknown[];
}

export interface IStudioRequest<C extends ControllerKeys, A extends ActionKeys<C>> extends IStudioRequestBase {
	controller: C;
	action: A;
	value: ActionArguments<C, A>;
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
