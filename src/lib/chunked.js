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
	{ context, onWrite, onError, onShellReady, abortSignal, nonce }
) {
	context = context || {};

	/** @type {RendererState} */
	const renderer = {
		start: Date.now(),
		abortSignal,
		onWrite,
		onError: handleError,
		reportError: onError || console.error,
		suspended: [],
		nonce
	};

	// Aborted before the shell could render, like a shell error.
	if (abortSignal && abortSignal.aborted) throw abortSignal.reason;

	try {
		// Synchronously render the shell
		// @ts-ignore - using third internal RendererState argument
		const shell = renderToString(vnode, context, renderer);
		if (onShellReady) onShellReady();

		// Wait for any suspended sub-trees if there are any
		const len = renderer.suspended.length;
		if (len > 0) {
			// When rendering a full HTML document, the shell ends with </body></html>.
			// Inserting deferred <template for> patches after </html> is invalid HTML
			// and causes browsers to reject the content. Instead, we inject the deferred
			// content before the closing tags, then emit them last.
			const docSuffixIndex = getDocumentClosingTagsIndex(shell);
			const hasHtmlTag = shell.trimStart().startsWith('<html');
			const initialWrite =
				docSuffixIndex !== -1 ? shell.slice(0, docSuffixIndex) : shell;
			const prefix = hasHtmlTag ? '<!DOCTYPE html>' : '';
			onWrite(prefix + initialWrite);
			onWrite(createInitScript(nonce));
			// We should keep checking all promises
			await forkPromises(renderer);
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
	const suspended = !recoverable && error && error.then;

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

	// An error below a boundary is reported and the boundary is left to the
	// client, the same goes for anything that suspends after an abort.
	const aborted = this.abortSignal && this.abortSignal.aborted;
	if (!suspended || aborted) {
		if (!recoverable && !suspended) this.reportError(error);
		abandon(this, vnode);
		if (found) {
			if (!aborted) this.onWrite(createClientRenderInstruction(id, this.nonce));
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
		pending.abort = abortPending.bind(null, pending);
		this.abortSignal.addEventListener('abort', pending.abort);
	}

	Promise.resolve(error)
		.then(retryPending.bind(null, pending), rejectPending.bind(null, pending))
		.catch(failPending.bind(null, pending))
		.then(
			finishPending.bind(null, pending, completion.resolve),
			finishPending.bind(null, pending, completion.reject)
		);

	const fallback = renderChild(vnode.props.fallback, vnode[PARENT]);
	return found
		? ''
		: `<!--$s?:${id}--><?start name="${id}">${fallback}<?end><!--/$s:${id}-->`;
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
		renderer.onWrite(createSubtree(pending.id, child, renderer.nonce));
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

/**
 * A boundary that failed on the server is reported and left to the client,
 * the rest of the stream carries on.
 */
function failPending(pending, error) {
	const renderer = pending.renderer;
	if (!renderer) return;
	renderer.reportError(error);
	clientRender(pending);
}

function abortPending(pending) {
	const renderer = pending.renderer;
	if (!renderer) return;
	renderer.reportError(renderer.abortSignal.reason);
	clientRender(pending);
}

/** Hand a flushed fallback, and the work below it, over to the client. */
function clientRender(pending) {
	const renderer = pending.renderer;
	if (!renderer) return;
	const id = pending.id;
	abandon(renderer, pending.vnode);
	renderer.onWrite(createClientRenderInstruction(id, renderer.nonce));
}

/** Complete the pending work at or below a boundary without streaming it. */
function abandon(renderer, vnode) {
	for (const pending of renderer.suspended) {
		let parent = pending.vnode;
		while (parent && parent !== vnode) parent = parent[PARENT];
		if (parent) finishPending(pending, pending.resolve);
	}
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
