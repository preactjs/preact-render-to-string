/**
 * @param {string} id
 */
function initPreactIsland(id) {
	const el = document.getElementById(id);
	if (!el) return;
	const stack = [document.body];
	let item;

	let startComment;
	while ((item = stack.pop()) !== undefined) {
		if (
			item.nodeType === 8 &&
			/** @type {Comment} **/
			item.data === id
		) {
			startComment = item;
			break;
		}

		// eslint-disable-next-line prefer-spread
		stack.push.apply(stack, item.childNodes);
	}

	const parent = startComment.parentNode;
	let next = startComment.nextSibling;
	let endComment;
	while (next !== null) {
		if (next.nodeType === 8 && next.data === '/' + id) {
			endComment = next;
			break;
		}

		const node = next;
		next = next.nextSibling;
		parent.removeChild(node);
	}

	while (el.childNodes.length > 0) {
		parent.insertBefore(el.firstChild, endComment);
	}

	el.parentNode.removeChild(el);
}

export const ISLAND_SCRIPT = `<script id="preact-island-script">${initPreactIsland.toString()}</script>`;

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<div hidden id="${id}">${content}</div><script>${initPreactIsland.name}("${id}");var s=document.currentScript;if(s)s.parentNode.removeChild(s);</script>`;
}

export function createCleanupScript() {
	return `<script>var s=document.getElementById('preact-island-script');if(s)s.parentNode.removeChild(s);var c=document.currentScript;if(c)c.parentNode.removeChild(c);</script>`;
}
