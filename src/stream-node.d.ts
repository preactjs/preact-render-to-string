import { VNode } from 'preact';
import { Writable } from 'node:stream';

interface RenderToPipeableStreamOptions {
	nonce?: string;
	onShellReady?: () => void;
	onAllReady?: () => void;
	/** Called when the shell fails to render, nothing is streamed. */
	onShellError?: (error: any) => void;
	/** Called for every render error and for every boundary left to the client by an abort. */
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
