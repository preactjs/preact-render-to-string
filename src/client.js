/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

/**
 * @param {number} c Total number of hydration islands
 */
function initPreactIslands(c) {
	var el = document.currentScript.parentNode;
	if (!document.getElementById('praect-island-style')) {
		var s = document.createElement('style');
		s.id = 'preact-island-style';
		s.textContent = 'preact-island{display:contents}';
		document.head.appendChild(s);
	}
	var o = new MutationObserver(function (m) {
		for (var i = 0; i < m.length; i++) {
			var added = m[i].addedNodes;
			for (var j = 0; j < added.length; j++) {
				if (added[j].nodeType !== 1) continue;
				var id = added[j].getAttribute('data-id');
				var target = document.getElementById(id);
				if (target) {
					while (target.firstChild !== null) {
						target.removeChild(target.firstChild);
					}
					while (added[j].firstChild !== null) {
						target.appendChild(added[j].firstChild);
					}
					target.hydrate = true;
				}
				if (--c === 0) {
					o.disconnect();
					el.parentNode.removeChild(el);
				}
			}
		}
	});
	o.observe(el, { childList: true, subtree: false });
}

const fn = initPreactIslands.toString();
const INIT_SCRIPT = fn
	.slice(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
	.replace(/\n\s+/gm, '');

/**
 * @param {number} total
 */
export function createInitScript(total) {
	return `<script>(function(){var c=${total};${INIT_SCRIPT}}())</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<div data-id="${id}">${content}</div>`;
}
