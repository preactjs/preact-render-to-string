import { Deferred } from './lib/util.js';
import { renderToChunks } from './lib/chunked.js';

/** @typedef {ReadableStream<Uint8Array> & { allReady: Promise<void>}} RenderStream */

/**
 * @param {import('preact').VNode} vnode
 * @param {any} [context]
 * @returns {RenderStream}
 */
export function renderToReadableStream(vnode, context) {
	/** @type {Deferred<void>} */
	const allReady = new Deferred();
	const encoder = new TextEncoder('utf-8');
	const abortController = new AbortController();
	let canceled = false;

	/** @type {RenderStream} */
	const stream = new ReadableStream({
		start(controller) {
			renderToChunks(vnode, {
				context,
				abortSignal: abortController.signal,
				onWrite(s) {
					if (canceled) return;
					controller.enqueue(encoder.encode(s));
				}
			})
				.then(() => {
					if (!canceled) controller.close();
					allReady.resolve();
				})
				.catch((error) => {
					if (canceled) {
						allReady.resolve();
						return;
					}
					controller.error(error);
					allReady.reject(error);
				});
		},
		cancel(reason) {
			canceled = true;
			abortController.abort(reason);
		}
	});

	stream.allReady = allReady.promise;

	return stream;
}
