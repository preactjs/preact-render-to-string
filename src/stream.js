import { Deferred } from './lib/util.js';
import { renderToChunks } from './lib/chunked.js';

/** @typedef {ReadableStream<Uint8Array> & { allReady: Promise<void>}} RenderStream */

/**
 * @param {import('preact').VNode} vnode
 * @param {any} [options]
 * @param {any} [context]
 * @returns {RenderStream}
 */
export function renderToReadableStream(vnode, options, context) {
	/** @type {Deferred<void>} */
	const allReady = new Deferred();
	// Not everyone awaits `allReady`, a failed render shouldn't crash them.
	allReady.promise.catch(() => {});
	const encoder = new TextEncoder('utf-8');
	const abort = new AbortController();
	const signal = options && options.signal;
	let closed = false;

	const onAbort = () => {
		if (!abort.signal.aborted && options.onError) {
			options.onError(signal.reason);
		}
		abort.abort();
	};
	if (signal) {
		if (signal.aborted) onAbort();
		else signal.addEventListener('abort', onAbort);
	}

	/** @type {RenderStream} */
	const stream = new ReadableStream({
		start(controller) {
			renderToChunks(vnode, {
				context,
				nonce: options?.nonce,
				abortSignal: abort.signal,
				onError: options?.onError,
				onWrite(s) {
					if (!closed) controller.enqueue(encoder.encode(s));
				}
			})
				.then(() => {
					if (!closed) controller.close();
					allReady.resolve();
				})
				.catch((error) => {
					if (!closed) controller.error(error);
					allReady.reject(error);
				})
				.then(() => {
					closed = true;
					if (signal) signal.removeEventListener('abort', onAbort);
				});
		},
		// The consumer went away, stop rendering for it.
		cancel() {
			closed = true;
			abort.abort();
		}
	});

	stream.allReady = allReady.promise;

	return stream;
}
