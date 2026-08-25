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
	const encoder = new TextEncoder('utf-8');

	let errored = false;

	/** @type {RenderStream} */
	const stream = new ReadableStream({
		start(controller) {
			renderToChunks(vnode, {
				context,
				nonce: options?.nonce,
				onError: (error) => {
					errored = true;
					allReady.reject(error);
					controller.error(error);
				},
				onWrite(s) {
					controller.enqueue(encoder.encode(s));
				}
			})
				.then(() => {
					// A deferred boundary may already have errored the stream, in
					// which case closing it would throw.
					if (errored) return;
					controller.close();
					allReady.resolve();
				})
				.catch((error) => {
					controller.error(error);
					allReady.reject(error);
				});
		}
	});

	stream.allReady = allReady.promise;

	return stream;
}
