import { renderToString } from '../index.js';
import { CHILD_DID_SUSPEND, COMPONENT, PARENT } from './constants.js';
import { Deferred } from './util.js';
import { createInitScript, createSubtree } from './client.js';

/**
 * @param {VNode} vnode
 * @param {RenderToChunksOptions} options
 * @returns {Promise<void>}
 */
export async function renderToChunks(
	vnode,
	{ context, onWrite, onError, abortSignal, nonce }
) {
	context = context || {};

	/** @type {RendererState} */
	const renderer = {
		start: Date.now(),
		abortSignal,
		onWrite,
		onError: handleError,
		onRenderError: onError,
		suspended: []
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
	// Errors thrown while rendering a resumed subtree come back through this
	// handler too. Surface them through the same caller callback as a rejected
	// suspension instead of letting the renderer turn them into an empty string.
	if (!error || !error.then) return propagateError(this, error);

	// Walk up to the Suspense boundary, testing the vnode that suspended before
	// its ancestors. A boundary whose render() returns a single keyless Fragment
	// is unwrapped by _renderToString, so the throw surfaces in the boundary's
	// own frame rather than a child's -- starting the walk at the parent skips
	// straight past it.
	while (vnode) {
		let component = vnode[COMPONENT];
		if (component && component[CHILD_DID_SUSPEND]) {
			break;
		}
		vnode = vnode[PARENT];
	}

	if (!vnode) return;

	const id = vnode.__v;
	const found = this.suspended.find((x) => x.id === id);
	const race = new Deferred();

	const abortSignal = this.abortSignal;
	if (abortSignal) {
		// @ts-ignore 2554 - implicit undefined arg
		if (abortSignal.aborted) race.resolve();
		else abortSignal.addEventListener('abort', race.resolve);
	}

	const promise = error.then(
		() => {
			if (abortSignal && abortSignal.aborted) return;
			const child = renderChild(vnode.props.children, vnode);
			if (child) this.onWrite(createSubtree(id, child));
		},
		// TODO: Abort and send hydration code snippet to client
		// to attempt to recover during hydration
		(error) => propagateError(this, error)
	);

	this.suspended.push({
		id,
		vnode,
		promise: Promise.race([promise, race.promise])
	});

	const fallback = renderChild(vnode.props.fallback);

	return found ? '' : `<!--$s:${id}-->${fallback}<!--/$s:${id}-->`;
}

/**
 * Hand an asynchronous render error to the caller, or reject the render when
 * no error callback was provided. Returning a string tells the recursive
 * renderer that the error was handled and prevents it from being swallowed.
 * @param {RendererState} renderer
 * @param {any} error
 * @returns {string}
 */
function propagateError(renderer, error) {
	if (renderer.onRenderError) {
		renderer.onRenderError(error);
		return '';
	}
	throw error;
}
