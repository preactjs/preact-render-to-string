import { renderToString } from '../index.js';
import { CHILD_DID_SUSPEND, COMPONENT, PARENT } from './constants.js';
import { Deferred } from './util.js';
import {
	createInitScript,
	createSubtree,
	createClientRenderInstruction
} from './client.js';
import { isRecoverableError } from './recoverable.js';

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
		clientRendered: new Set(),
		flushed: false,
		nonce
	};

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
		renderer.flushed = true;
		onWrite('<div hidden>');
		onWrite(createInitScript(nonce));
		// We should keep checking all promises
		await forkPromises(renderer);
		onWrite('</div>');
		if (docSuffixIndex !== -1) onWrite(shell.slice(docSuffixIndex));
	} else {
		onWrite(shell);
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
	const recoverable = isRecoverableError(error);
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
	if (this.clientRendered.has(id)) return '';
	const found = this.suspended.find((x) => x.id === id);

	if (recoverable) {
		this.clientRendered.add(id);
		for (const pending of this.suspended) {
			let parent = pending.vnode;
			while (parent && parent !== vnode) parent = parent[PARENT];
			if (parent) {
				pending.cancelled = true;
				pending.resolve();
			}
		}
		if (found && this.flushed) {
			this.onWrite(createClientRenderInstruction(id, this.nonce));
			return '';
		}
		return `<!--$s!:${id}-->${renderChild(vnode.props.fallback, vnode[PARENT])}<!--/$s:${id}-->`;
	}

	const completion = new Deferred();
	const pending = {
		id,
		vnode,
		promise: completion.promise,
		resolve: completion.resolve,
		cancelled: false
	};
	this.suspended.push(pending);
	const abortSignal = this.abortSignal;
	const abort = () => {
		pending.cancelled = true;
		completion.resolve();
	};
	if (abortSignal) {
		if (abortSignal.aborted) abort();
		else abortSignal.addEventListener('abort', abort);
	}

	Promise.resolve(error)
		.then(
			() => {
				if (pending.cancelled) return;
				const suspendedCount = this.suspended.length;
				const child = renderChild(vnode.props.children, vnode);
				const suspendedAgain = this.suspended
					.slice(suspendedCount)
					.some((s) => s.id === id);
				if (
					!pending.cancelled &&
					!this.clientRendered.has(id) &&
					!suspendedAgain
				) {
					this.onWrite(createSubtree(id, child));
				}
			},
			(error) => {
				if (pending.cancelled) return;
				if (!isRecoverableError(error)) throw error;
				return handleError.call(this, error, vnode, renderChild);
			}
		)
		.then(completion.resolve, completion.reject)
		.then(() => {
			if (abortSignal) abortSignal.removeEventListener('abort', abort);
		});

	const fallback = renderChild(vnode.props.fallback, vnode[PARENT]);
	return found ? '' : `<!--$s:${id}-->${fallback}<!--/$s:${id}-->`;
}
