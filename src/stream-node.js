import { PassThrough } from 'node:stream';

import { renderToChunks } from './index';

/**
 * @typedef {object} RenderToPipeableStreamOptions
 * @property {() => void} [onShellReady]
 * @property {() => void} [onAllReady]
 * @property {() => void} [onError]
 */

/**
 * @param {VNode} vnode
 * @param {RenderToPipeableStreamOptions} options
 * @param {any} [context]
 * @returns {{}}
 */
export function renderToPipeableStream(vnode, options, context) {
	const encoder = new TextEncoder('utf-8');

	const controller = new AbortController();
	const stream = new PassThrough();

	renderToChunks(vnode, {
		context,
		abortSignal: controller.signal,
		onError: (error) => {
			if (options.onError) {
				options.onError(error);
			}
			controller.abort(error);
		},
		onWrite(s) {
			stream.write(encoder.encode(s));
		}
	})
		.then(() => {
			options.onAllReady && options.onAllReady();
			stream.end();
		})
		.catch((error) => {
			stream.destroy(error);
		});

	Promise.resolve().then(() => {
		options.onShellReady && options.onShellReady();
	});

	return {
		abort() {
			controller.abort();
			stream.destroy(new Error('aborted'));
		},
		/**
		 * @param {import("stream").Writable} writable
		 */
		pipe(writable) {
			stream.pipe(writable, { end: true });
		}
	};
}
