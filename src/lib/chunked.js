import { renderToString } from '../index.js';
import { COMPONENT, MASK, PARENT } from './constants.js';
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
		id: 0,
		nonce
	};

	// Aborted before the shell could render, like a shell error.
	if (abortSignal && abortSignal.aborted) throw abortSignal.reason;

	try {
		// Synchronously render the shell
		// @ts-ignore - using third internal RendererState argument
		const shell = renderToString(vnode, context, renderer);
		if (onShellReady) onShellReady();

		const prefix = shell.trimStart().startsWith('<html')
			? '<!DOCTYPE html>'
			: '';
		// Wait for any suspended sub-trees if there are any
		const len = renderer.suspended.length;
		if (len > 0) {
			// When rendering a full HTML document, the shell ends with </body></html>.
			// Inserting the deferred islands after </html> is invalid HTML and causes
			// browsers to reject the content. Instead, we inject the deferred content
			// before the closing tags, then emit them last. There is no wrapper around
			// them: hydrating a whole document would remove it while the parser
			// still writes chunks into it.
			const docSuffixIndex = getDocumentClosingTagsIndex(shell);
			const initialWrite =
				docSuffixIndex !== -1 ? shell.slice(0, docSuffixIndex) : shell;
			onWrite(prefix + initialWrite);
			onWrite(createInitScript(nonce));
			// We should keep checking all promises
			await forkPromises(renderer);
			if (docSuffixIndex !== -1) onWrite(shell.slice(docSuffixIndex));
		} else {
			onWrite(prefix + shell);
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
	// Only a document that actually ends in </body> (and maybe </html>). A
	// `</body>` inside the shell, from raw HTML, is not the close tag.
	const match = /<\/body>\s*(?:<\/html>\s*)?$/i.exec(html);
	return match ? match.index : -1;
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

/**
 * Called from the frame of the Suspense boundary that something suspended or
 * failed below. All the boundary rendered so far is dropped for its fallback.
 * @type {RendererErrorHandler}
 */
function handleError(error, vnode, renderChild) {
	const recoverable = isRecoverable(error);
	const suspended = !recoverable && error && error.then;

	// The boundaries that suspended below this one never reach the response,
	// they render again with this one's content.
	abandon(this, vnode);

	// An error below a boundary is reported and the boundary is left to the
	// client, the same goes for anything that suspends after an abort.
	if (!suspended || (this.abortSignal && this.abortSignal.aborted)) {
		if (!recoverable && !suspended) this.reportError(error);
		return `<!--$s!-->${renderChild(vnode.props.fallback, vnode[PARENT])}<!--/$s-->`;
	}

	const completion = new Deferred();
	const pending = {
		// Numbered per response: the id is written four times per boundary
		id: (this.id++).toString(36),
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

	waitFor(pending, error).then(
		finishPending.bind(null, pending, completion.resolve),
		finishPending.bind(null, pending, completion.reject)
	);

	// The fallback renders next to the boundary, not below it: a boundary
	// inside it has its range in the response, whatever this one does next.
	// The closing marker carries the id too, so the island finds this range's
	// end without counting the ranges inside it.
	return `<!--$s?${pending.id}-->${renderChild(vnode.props.fallback, vnode[PARENT])}<!--/$s?${pending.id}-->`;
}

/** Render the boundary's content once the promise it waits on settles. */
function waitFor(pending, promise) {
	return Promise.resolve(promise)
		.then(retryPending.bind(null, pending), rejectPending.bind(null, pending))
		.catch(failPending.bind(null, pending));
}

function retryPending(pending) {
	const renderer = pending.renderer;
	if (!renderer) return;
	const vnode = pending.vnode;
	// The retry renders the boundary's children from scratch: restart its
	// useId counter so ids match a client that renders them in one go.
	const mask = vnode[COMPONENT] && vnode[COMPONENT][MASK];
	if (mask) mask[1] = 0;
	let child;
	try {
		child = pending.renderChild(vnode.props.children, vnode);
	} catch (error) {
		// The boundaries found in this attempt go with what it rendered
		abandon(renderer, vnode, pending);
		if (
			isRecoverable(error) ||
			!error ||
			!error.then ||
			(renderer.abortSignal && renderer.abortSignal.aborted)
		) {
			return rejectPending(pending, error);
		}
		// Suspended again: its range is in the response already, so wait
		return waitFor(pending, error);
	}
	renderer.onWrite(createSubtree(pending.id, child));
}

function rejectPending(pending, error) {
	if (!pending.renderer) return;
	if (!isRecoverable(error)) throw error;
	clientRender(pending);
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
	renderer.onWrite(createClientRenderInstruction(id));
}

/**
 * Complete the pending work at or below a boundary without streaming it.
 * @param {RendererState} renderer
 * @param {VNode} vnode
 * @param {Suspended} [except] The boundary's own work, when it carries on
 */
function abandon(renderer, vnode, except) {
	for (const pending of renderer.suspended) {
		let parent = pending.vnode;
		while (parent && parent !== vnode) parent = parent[PARENT];
		if (parent && pending !== except) finishPending(pending, pending.resolve);
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
