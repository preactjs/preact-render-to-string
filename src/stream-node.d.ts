import { VNode } from 'preact';
import { WritableStream } from 'node:stream';

interface RenderToPipeableStreamOptions {
	onShellReady?: () => void;
	onAllReady?: () => void;
	onError?: (error: any) => void;
}

interface PipeableStream {
	abort: () => void;
	pipe: (writable: WritableStream) => void;
}

export function renderToReadableStream(
	vnode: VNode,
	options: RenderToPipeableStreamOptions,
	context?: any
): PipeableStream;
