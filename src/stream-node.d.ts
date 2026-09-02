import { VNode } from 'preact';
import { Writable } from 'node:stream';

interface RenderToPipeableStreamOptions {
	nonce?: string;
	onShellReady?: () => void;
	onAllReady?: () => void;
	onError?: (error: any) => void;
}

interface PipeableStream {
	abort: (reason?: unknown) => void;
	pipe: (writable: Writable) => void;
}

export function renderToPipeableStream<P = {}>(
	vnode: VNode<P>,
	options: RenderToPipeableStreamOptions,
	context?: any
): PipeableStream;
