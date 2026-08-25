import { ComponentChildren, ComponentChild, VNode } from 'preact';

interface Suspended {
	id: string;
	promise: Promise<any>;
	context: any;
	isSvgMode: boolean;
	selectValue: any;
	vnode: VNode;
	parent: VNode | null;
}

interface RendererErrorHandler {
	(
		this: RendererState,
		error: any,
		vnode: VNode<{ fallback: any }>,
		renderChild: (child: ComponentChildren, parent: ComponentChild) => string
	): string | undefined;
}

interface RendererState {
	start: number;
	suspended: Suspended[];
	abortSignal?: AbortSignal | undefined;
	onWrite: (str: string) => void;
	onError?: RendererErrorHandler;
	onSuspenseError?: (error: any) => void;
}

interface CapturedHooks {
	beforeDiff?: (vnode: VNode) => void;
	afterDiff?: (vnode: VNode) => void;
	renderHook?: (vnode: VNode) => void;
	unmountHook?: (vnode: VNode) => void;
	rootHook?: (vnode: VNode, parentDom: any) => void;
	commitHook?: (vnode: VNode, commitQueue: any[]) => void;
	catchError?: (error: any, vnode: VNode) => void;
	errorBoundaries?: boolean;
}

interface RenderToChunksOptions {
	context?: any;
	onError?: (error: any) => void;
	onWrite: (str: string) => void;
	abortSignal?: AbortSignal;
	nonce?: string;
}
