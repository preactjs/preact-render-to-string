import { PassThrough } from 'node:stream';
import { renderToChunks } from './lib/chunked.js';

/**
 * @typedef {object} RenderToPipeableStreamOptions
 * @property {() => void} [onShellReady]
 * @property {(error) => void} [onShellError]
 * @property {() => void} [onAllReady]
 * @property {(error) => void} [onError]
 */

/**
 * @typedef {object} PipeableStream
 * @property {() => void} abort
 * @property {(writable: import('stream').Writable) => void} pipe
 */

/**
 * @param {import('preact').VNode} vnode
 * @param {RenderToPipeableStreamOptions} options
 * @param {any} [context]
 * @returns {PipeableStream}
 */
export function renderToPipeableStream(vnode, options, context) {
	const encoder = new TextEncoder('utf-8');

	const controller = new AbortController();
	const stream = new PassThrough();
	let shellReady = false;
	// Deferred so `pipe` can be called from it, but never after `onAllReady`.
	const flushShellReady = () => {
		if (shellReady && options.onShellReady) options.onShellReady();
		shellReady = false;
	};

	renderToChunks(vnode, {
		context,
		abortSignal: controller.signal,
		nonce: options.nonce,
		onError: options.onError,
		onShellReady() {
			shellReady = true;
		},
		onWrite(s) {
			stream.write(encoder.encode(s));
		}
	})
		.then(() => {
			flushShellReady();
			if (options.onAllReady) options.onAllReady();
			stream.end();
		})
		.catch((error) => {
			stream.destroy();
			(options.onError || console.error)(error);
			if (options.onShellError) options.onShellError(error);
		});

	Promise.resolve().then(flushShellReady);

	/**
	 * @param {unknown} [reason]
	 */
	function abort(
		reason = new Error('The render was aborted by the server without a reason.')
	) {
		// Remix/React-Router will always call abort after a timeout, even on success
		if (stream.closed || controller.signal.aborted) return;

		// Pending boundaries are reported, handed to the client and the
		// response ends.
		controller.abort(reason);
	}

	return {
		abort,
		/**
		 * @param {import("stream").Writable} writable
		 */
		pipe(writable) {
			stream.pipe(writable, { end: true });
			stream.once('close', () => {
				if (!stream.readableEnded) writable.destroy();
			});
			writable.once('close', () => {
				if (!writable.writableFinished) {
					abort(new Error('The destination stream closed early.'));
				}
			});
		}
	};
}
