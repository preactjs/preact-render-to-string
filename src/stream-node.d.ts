import { VNode } from 'preact';
import { WritableStream } from 'node:stream';

interface RenderToPipeableStreamOptions {
	onShellReady?: () => void;
	onAllReady?: () => void;
	onError?: (error: any) => void;
}

interface PipeableStream {
	abort: (reason?: unknown) => void;
	pipe: (writable: WritableStream) => void;
}

export function renderToPipeableStream<P = {}>(
	vnode: VNode<P>,
	options: RenderToPipeableStreamOptions,
	context?: any
): PipeableStream;
