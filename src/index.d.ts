import { VNode } from 'preact';

interface Options {
	attributeHook?: (name: string) => string;
}

export default function renderToString(
	vnode: VNode,
	context?: any,
	options?: Options
): string;

export function render(vnode: VNode, context?: any, options?: Options): string;

export function renderToString(
	vnode: VNode,
	context?: any,
	options?: Options
): string;

export function renderToStaticMarkup(
	vnode: VNode,
	context?: any,
	options?: Options
): string;
