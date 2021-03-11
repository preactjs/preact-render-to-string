import { VNode } from 'preact';

interface Options {
	shallow?: boolean;
	xml?: boolean;
	pretty?: boolean | string;
}

export function renderToString(
	vnode: VNode,
	context?: any,
	options?: Options
): string;
export const render: typeof renderToString;
export function shallowRender(vnode: VNode, context?: any): string;
