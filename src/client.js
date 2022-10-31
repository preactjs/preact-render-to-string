/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

function initPreactIslandElement() {
	class PreactIslandElement extends HTMLElement {
		connectedCallback() {
			if (!this.isConnected) return;

			let i = this.getAttribute('data-target');
			if (!i) return;

			var d = this;
			function f(el) {
				var a = [];
				for (var j = 0; j < el.childNodes.length; j++) {
					var n = el.childNodes[j];
					if (n.nodeType === 8) {
						a.push(n);
					} else {
						a.push(...f(n));
					}
				}
				return a;
			}
			var s, e;
			for (var n of f(document)) {
				if (n.data == 'preact-island:' + i) s = n;
				else if (n.data == '/preact-island:' + i) e = n;
				if (s && e) break;
			}
			if (s && e) {
				var p = e.previousSibling;
				for (; p != s; ) {
					if (!p || p == s) break;

					e.parentNode.removeChild(p);
					p = e.previousSibling;
				}
				for (; d.firstChild; ) {
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
