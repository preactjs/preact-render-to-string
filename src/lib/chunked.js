import { renderToString } from '../index.js';
import { CHILD_DID_SUSPEND, COMPONENT, PARENT } from './constants.js';
import { Deferred } from './util.js';
import {
	createInitScript,
	createSubtree,
	createClientRenderInstruction
} from './client.js';
import { isRecoverable } from './recoverable.js';

/**
 * @param {VNode} vnode
 * @param {RenderToChunksOptions} options
 * @returns {Promise<void>}
 */
export async function renderToChunks(
	vnode,
	{ context, onWrite, abortSignal, nonce }
) {
	context = context || {};

	/** @type {RendererState} */
	const renderer = {
		start: Date.now(),
		abortSignal,
		onWrite,
		onError: handleError,
		suspended: [],
		nonce
	};

	try {
		// Synchronously render the shell
		// @ts-ignore - using third internal RendererState argument
		const shell = renderToString(vnode, context, renderer);

		// Wait for any suspended sub-trees if there are any
		const len = renderer.suspended.length;
		if (len > 0) {
			// When rendering a full HTML document, the shell ends with </body></html>.
			// Inserting the deferred <div hidden> wrapper after </html> is invalid HTML
			// and causes browsers to reject the content. Instead, we inject the deferred
			// content before the closing tags, then emit them last.
			const docSuffixIndex = getDocumentClosingTagsIndex(shell);
			const hasHtmlTag = shell.trimStart().startsWith('<html');
			const initialWrite =
				docSuffixIndex !== -1 ? shell.slice(0, docSuffixIndex) : shell;
			const prefix = hasHtmlTag ? '<!DOCTYPE html>' : '';
			onWrite(prefix + initialWrite);
			onWrite('<div hidden>');
			onWrite(createInitScript(nonce));
			// We should keep checking all promises
			await forkPromises(renderer);
			onWrite('</div>');
			if (docSuffixIndex !== -1) onWrite(shell.slice(docSuffixIndex));
		} else {
			onWrite(shell);
		}
	} finally {
		for (const pending of renderer.suspended)
			finishPending(pending, pending.resolve);
	}
}

/**
 * If the shell ends with </body></html> (full document rendering), return that
 * suffix so it can be emitted *after* the deferred content, keeping the HTML valid.
 * @param {string} html
 * @returns {number}
 */
function getDocumentClosingTagsIndex(html) {
	return html.lastIndexOf('</body>');
}

async function forkPromises(renderer) {
	if (renderer.suspended.length > 0) {
		const suspensions = [...renderer.suspended];
		await Promise.all(renderer.suspended.map((s) => s.promise));
		renderer.suspended = renderer.suspended.filter(
			(s) => !suspensions.includes(s)
		);
		await forkPromises(renderer);
	}
}

/** @type {RendererErrorHandler} */
function handleError(error, vnode, renderChild) {
	const recoverable = isRecoverable(error);
	if (!recoverable && (!error || !error.then)) throw error;

	// Recoverables reach this handler at the boundary itself. Promise retries
	// can reach it from a descendant, just like their initial suspension.
	if (
		!recoverable ||
		!vnode[COMPONENT] ||
		!vnode[COMPONENT][CHILD_DID_SUSPEND]
	) {
		while ((vnode = vnode[PARENT])) {
			const component = vnode[COMPONENT];
			if (component && component[CHILD_DID_SUSPEND]) break;
		}
	}
	if (!vnode) throw error;

	const id = vnode.__v;
	const found = this.suspended.find((x) => x.id === id);

	if (recoverable) {
		for (const pending of this.suspended) {
			let parent = pending.vnode;
			while (parent && parent !== vnode) parent = parent[PARENT];
			if (parent) finishPending(pending, pending.resolve);
		}
		if (found) {
			this.onWrite(createClientRenderInstruction(id, this.nonce));
			return '';
		}
		return `<!--$s!:${id}-->${renderChild(vnode.props.fallback, vnode[PARENT])}<!--/$s:${id}-->`;
	}

	const completion = new Deferred();
	const pending = {
		id,
		vnode,
		renderer: this,
		renderChild,
		promise: completion.promise,
		resolve: completion.resolve,
		abort: null
	};
	this.suspended.push(pending);
	if (this.abortSignal) {
		// Do not resolve the completion promise with the abort event.
		pending.abort = finishPending.bind(
			null,
			pending,
			pending.resolve,
			undefined
		);
		if (this.abortSignal.aborted) pending.abort();
		else this.abortSignal.addEventListener('abort', pending.abort);
	}

	Promise.resolve(error)
		.then(retryPending.bind(null, pending), rejectPending.bind(null, pending))
		.then(
			finishPending.bind(null, pending, completion.resolve),
			finishPending.bind(null, pending, completion.reject)
		);

	const fallback = renderChild(vnode.props.fallback, vnode[PARENT]);
	return found ? '' : `<!--$s:${id}-->${fallback}<!--/$s:${id}-->`;
}

function retryPending(pending) {
	const renderer = pending.renderer;
	if (!renderer) return;
	const vnode = pending.vnode;
	const suspendedCount = renderer.suspended.length;
	const child = pending.renderChild(vnode.props.children, vnode);
	const suspendedAgain = renderer.suspended
		.slice(suspendedCount)
		.some((s) => s.id === pending.id);
	if (pending.renderer && !suspendedAgain) {
		renderer.onWrite(createSubtree(pending.id, child));
	}
}

function rejectPending(pending, error) {
	if (!pending.renderer) return;
	if (!isRecoverable(error)) throw error;
	return handleError.call(
		pending.renderer,
		error,
		pending.vnode,
		pending.renderChild
	);
}

function finishPending(pending, settle, value) {
	const renderer = pending.renderer;
	if (!renderer) return;
	if (renderer.abortSignal && pending.abort) {
		renderer.abortSignal.removeEventListener('abort', pending.abort);
	}
	pending.vnode = pending.renderer = pending.renderChild = null;
	pending.abort = null;
	settle(value);
}
