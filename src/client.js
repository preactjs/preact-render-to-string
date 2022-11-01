/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

function initPreactIslandElement() {
	class PreactIslandElement extends HTMLElement {
		connectedCallback() {
			var d = this;
			if (!d.isConnected) return;

			let i = this.getAttribute('data-target');
			if (!i) return;

			var s,
				e,
				c = document.createNodeIterator(document, NodeFilter.SHOW_COMMENT);
			while (c.nextNode()) {
				let n = c.referenceNode;
				if (n.data == 'preact-island:' + i) s = n;
				else if (n.data == '/preact-island:' + i) e = n;
				if (s && e) break;
			}
			if (s && e) {
				var p = e.previousSibling;
				while (p != s) {
					if (!p || p == s) break;

					e.parentNode.removeChild(p);
					p = e.previousSibling;
				}
				while (d.firstChild) {
					e.parentNode.insertBefore(d.firstChild, e);
				}
				d.parentNode.removeChild(d);
			}
		}
	}

	customElements.define('preact-island', PreactIslandElement);
}

const fn = initPreactIslandElement.toString();
const INIT_SCRIPT = fn
	.slice(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
	.replace(/\n\s+/gm, '');

export function createInitScript() {
	return `<script>(function(){${INIT_SCRIPT}}())</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<preact-island hidden data-target="${id}">${content}</preact-island>`;
}
