import { VNode } from 'preact';

interface Options {
	jsx?: boolean;
	xml?: boolean;
	/** Enable or disable error boundaries (default: false) */
	errorBoundaries?: boolean;
	functions?: boolean;
	functionNames?: boolean;
	skipFalseAttributes?: boolean;
	pretty?: boolean | string;
}

export function render(vnode: VNode, context?: any, options?: Options): string;
export default render;
