import { VNode } from 'preact';

interface RenderOptions {
	attrHook?: (name: string) => string;
}

export default function renderToString(
	vnode: VNode,
	context?: any,
	renderOpts?: RenderOptions
): string;

export function render(
	vnode: VNode,
	context?: any,
	renderOpts?: RenderOptions
): string;
export function renderToString(
	vnode: VNode,
	context?: any,
	renderOpts?: RenderOptions
): string;
export function renderToStaticMarkup(
	vnode: VNode,
	context?: any,
	renderOpts?: RenderOptions
): string;
