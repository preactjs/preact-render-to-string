import { PassThrough } from 'node:stream';
import { renderToChunks } from './lib/chunked.js';

/**
 * @typedef {object} RenderToPipeableStreamOptions
 * @property {() => void} [onShellReady]
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
	let waitingForDrain = null;

	/**
	 * @returns {Promise<void>}
	 */
	function waitForDrain() {
		if (waitingForDrain) return waitingForDrain;
		waitingForDrain = new Promise((resolve, reject) => {
			const cleanup = () => {
				stream.off('drain', onDrain);
				stream.off('close', onClose);
				stream.off('error', onError);
				waitingForDrain = null;
			};
			const onDrain = () => {
				cleanup();
				resolve();
			};
			const onClose = () => {
				cleanup();
				resolve();
			};
			const onError = (error) => {
				cleanup();
				reject(error);
			};

			stream.on('drain', onDrain);
			stream.on('close', onClose);
			stream.on('error', onError);
		});
		return waitingForDrain;
	}

	renderToChunks(vnode, {
		context,
		abortSignal: controller.signal,
		async onWrite(s) {
			if (stream.destroyed || stream.writableEnded) return;
			if (!stream.write(encoder.encode(s))) {
				await waitForDrain();
			}
		}
	})
		.then(() => {
			options.onAllReady && options.onAllReady();
			stream.end();
		})
		.catch((error) => {
			stream.destroy();
			if (options.onError) {
				options.onError(error);
			} else {
				throw error;
			}
		});

	Promise.resolve().then(() => {
		options.onShellReady && options.onShellReady();
	});

	return {
		/**
		 * @param {unknown} [reason]
		 */
		abort(
			reason = new Error(
				'The render was aborted by the server without a reason.'
			)
		) {
			// Remix/React-Router will always call abort after a timeout, even on success
			if (stream.closed) return;

			controller.abort();
			stream.destroy();
			if (options.onError) {
				options.onError(reason);
			}
		},
		/**
		 * @param {import("stream").Writable} writable
		 */
		pipe(writable) {
			stream.pipe(writable, { end: true });
		}
	};
}
