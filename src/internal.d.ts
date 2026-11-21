import { ComponentChildren, ComponentChild, VNode } from 'preact';

interface Suspended {
	id: string;
	promise: Promise<any>;
	resolve: () => void;
	vnode: VNode | null;
	renderer: RendererState | null;
	renderChild: RenderChild | null;
	context: any;
	abort: (() => void) | null;
}

type RenderChild = (
	child: ComponentChildren,
	parent: ComponentChild,
	context?: any
) => string;

interface RendererErrorHandler {
	(
		this: RendererState,
		error: any,
		vnode: VNode<{ fallback: any }>,
		renderChild: RenderChild
	): string | undefined;
}

interface RendererState {
	start: number;
	reportError: (error: any) => void;
	nonce?: string;
	suspended: Suspended[];
	abortSignal?: AbortSignal | undefined;
	onWrite: (str: string) => void;
	onError?: RendererErrorHandler;
	markup: Map<VNode, string>;
	contexts: Map<VNode, any>;
	takeMarkup: (this: RendererState, vnode: VNode) => string;
	rendering: boolean;
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
	onShellReady?: () => void;
	onWrite: (str: string) => void;
	abortSignal?: AbortSignal;
	nonce?: string;
}
