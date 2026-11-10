import { VNode } from 'preact';

interface RenderStream extends ReadableStream<Uint8Array> {
	allReady: Promise<void>;
}

interface RenderToReadableStreamOptions {
	nonce?: string;
	/** Called for render errors inside suspended subtrees and when aborted. */
	onError?: (error: any) => void;
	/** Aborting hands the pending boundaries to the client and ends the stream. */
	signal?: AbortSignal;
}

export function renderToReadableStream<P = {}>(
	vnode: VNode<P>,
	options?: RenderToReadableStreamOptions,
	context?: any
): RenderStream;
