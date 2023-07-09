import { VNode } from 'preact';

interface Options {
	jsx?: boolean;
	xml?: boolean;
	functions?: boolean;
	functionNames?: boolean;
	skipFalseAttributes?: boolean;
	pretty?: boolean | string;
	errorBoundaries?: boolean;
}

export function render(vnode: VNode, context?: any, options?: Options): string;
export default render;
