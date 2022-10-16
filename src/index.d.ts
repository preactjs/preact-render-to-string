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

export interface ChunkedOptions {
	onWrite(chunk: string): void;
	context?: any;
	abortSignal?: AbortSignal;
}
export function renderChunked(vnode: VNode, options: ChunkedOptions): void;

export default render;
