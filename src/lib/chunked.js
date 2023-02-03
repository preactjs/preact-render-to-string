import renderToString from '../index';
import { CHILD_DID_SUSPEND, COMPONENT, MASK, PARENT } from './constants';
import { Deferred } from './util';
import { createInitScript, createSubtree } from './client';

/**
 * @param {VNode} vnode
 * @param {RenderToChunksOptions} options
 * @returns {Promise<void>}
 */
export async function renderToChunks(vnode, { context, onWrite, abortSignal }) {
	context = context || {};

	/** @type {RendererState} */
	const renderer = {
		start: Date.now(),
		abortSignal,
		onWrite,
		onError: handleError,
		suspended: []
	};

	// Synchronously render the shell
	// @ts-ignore - using third internal RendererState argument
	const shell = renderToString(vnode, context, renderer);
	onWrite(shell);

	// Wait for any suspended sub-trees if there are any
	const len = renderer.suspended.length;
	if (len > 0) {
		onWrite('<div hidden>');
		onWrite(createInitScript(len));
		await Promise.all(renderer.suspended.map((s) => s.promise));
		onWrite('</div>');
	}
}

/** @type {RendererErrorHandler} */
function handleError(error, vnode, renderChild) {
	if (!error || !error.then) return;

	// walk up to the Suspense boundary
	while ((vnode = vnode[PARENT])) {
		let component = vnode[COMPONENT];
		if (component && component[CHILD_DID_SUSPEND]) {
			break;
		}
	}

	if (!vnode) return;

	const id = vnode[MASK] + this.suspended.length;

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
			this.onWrite(createSubtree(id, renderChild(vnode.props.children)));
		},
		// TODO: Abort and send hydration code snippet to client
		// to attempt to recover during hydration
		this.onError
	);

	this.suspended.push({
		id,
		vnode,
		promise: Promise.race([promise, race.promise])
	});

	const fallback = renderChild(vnode.props.fallback);

	return `<!--preact-island:${id}-->${fallback}<!--/preact-island:${id}-->`;
}
