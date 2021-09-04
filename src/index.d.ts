import { VNode } from 'preact';

interface Options {
	shallow?: boolean;
	xml?: boolean;
	pretty?: boolean | string;
}

export function render(vnode: VNode, context?: any, options?: Options): string;
export function renderToString(
	vnode: VNode,
	context?: any,
	options?: Options
): string;
export function shallowRender(vnode: VNode, context?: any): string;
export default render;

export type SerializeFunc = (
	vnodeOrArray: VNode | VNode[],
	context: any,
	...stack: any
) => any;

export interface Format<T> {
	result(): T;

	text(serialize: SerializeFunc, str: string, context: any, ...stack: any): any;

	array(
		serialize: SerializeFunc,
		array: VNode[],
		context: any,
		...stack: any
	): any;

	element(
		serialize: SerializeFunc,
		vnode: VNode,
		context: any,
		...stack: any
	): any;

	object(
		serialize: SerializeFunc,
		vnode: VNode,
		context: any,
		...stack: any
	): any;
}

export class StringFormat implements Format<string> {
	push(s: string): void;

	result(): string;

	text(serialize: SerializeFunc, str: string, context: any, ...stack: any): any;

	array(
		serialize: SerializeFunc,
		array: VNode[],
		context: any,
		...stack: any
	): any;

	element(
		serialize: SerializeFunc,
		vnode: VNode,
		context: any,
		...stack: any
	): any;

	object(
		serialize: SerializeFunc,
		vnode: VNode,
		context: any,
		...stack: any
	): any;
}

export function serialize<T>(vnode: VNode, format: Format<T>): T;

export function serializeToString(vnode: VNode): string;
