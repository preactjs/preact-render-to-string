import { Deferred } from './util';
import { renderChunked } from './index';

/** @typedef {ReadableStream<Uint8Array> & { allReady: Promise<void>}} RenderStream */

/**
 * @param {VNode} vnode
 * @param {any} [context]
 * @returns {RenderStream}
 */
export function renderToReadableStream(vnode, context) {
	/** @type {Deferred<void>} */
	const allReady = new Deferred();
	/** @type {Deferred<void>} */
	const suspended = new Deferred();
	const encoder = new TextEncoder('utf-8');

	renderChunked(vnode, context);

	const ctx = {
		suspended: []
	};

	setTimeout(() => suspended.resolve(), 1000);

	/** @type {RenderStream} */
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(shell));

			if (ctx.suspended.length === 0) {
				controller.close();
				allReady.resolve();
				return;
			}

			suspended.promise
				.then(() => {
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
