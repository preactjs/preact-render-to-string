import { Deferred } from './util';
import { renderToChunks } from './index';

/** @typedef {ReadableStream<Uint8Array> & { allReady: Promise<void>}} RenderStream */

/**
 * @param {VNode} vnode
 * @param {any} [context]
 * @returns {RenderStream}
 */
export function renderToReadableStream(vnode, context) {
	/** @type {Deferred<void>} */
	const allReady = new Deferred();
	const encoder = new TextEncoder('utf-8');

	/** @type {RenderStream} */
	const stream = new ReadableStream({
		start(controller) {
			renderToChunks(vnode, {
				context,
				onWrite(s) {
					controller.enqueue(encoder.encode(s));
				}
			})
				.then(() => {
					controller.close();
					allReady.resolve();
				})
				.catch((error) => {
					controller.error(error);
					allReady.reject(error);
				});
			// controller.enqueue(encoder.encode(shell));
		}
	});

	stream.allReady = allReady.promise;

	return stream;
}
