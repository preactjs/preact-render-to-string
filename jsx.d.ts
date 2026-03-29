import { VNode } from 'preact';

interface Options {
	jsx?: boolean;
	xml?: boolean;
	pretty?: boolean | string;
	shallow?: boolean;
	functions?: boolean;
	functionNames?: boolean;
	skipFalseAttributes?: boolean;
}

declare function renderToStringPretty(
	vnode: VNode,
	context?: any,
	options?: Options
): string;

declare namespace renderToStringPretty {
	export function render(
		vnode: VNode,
		context?: any,
		options?: Options
	): string;

	export function shallowRender(
		vnode: VNode,
		context?: any,
		options?: Options
	): string;
}

export = renderToStringPretty;
