import type Routes from "./routes";
import type { ResponseCode } from "./enum";

type RouteMap = typeof Routes;

export type ControllerKeys = keyof RouteMap;

export type ActionKeys<T extends ControllerKeys> = keyof RouteMap[T];

export type ActionArguments<T extends ControllerKeys, U extends ActionKeys<T>> = Parameters<RouteMap[T][U]>;

export type ActionResult<T extends ControllerKeys, U extends ActionKeys<T>> = ReturnType<RouteMap[T][U]>;

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

export type StudioResponse = {
	value: unknown;
} | {
	/** 這種情況總是代表發生未知的錯誤 */
	error: string;
};

export { ResponseCode };
