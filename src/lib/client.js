import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// function initPreactIslandElement() {
// 	class PreactIslandElement extends HTMLElement {
// 		connectedCallback() {
// 			var d = this;
// 			if (!d.isConnected) return;

// 			let i = this.getAttribute('data-target');
// 			if (!i) return;

// 			var s,
// 				e,
// 				c = document.createNodeIterator(document, 128);
// 			while (c.nextNode()) {
// 				let n = c.referenceNode;

// 				if (n.data == '$s:' + i) s = n;
// 				else if (n.data == '/$s:' + i) e = n;
// 				if (s && e) break;
// 			}
// 			if (s && e && s.parentNode !== document) {
// 				requestAnimationFrame(() => {
// 					// Hydration may finish after connectedCallback queues this frame.
// 					if (!d.isConnected || !s.isConnected || !e.isConnected || s.parentNode !== e.parentNode) {
// 						d.remove();
// 						return;
// 					}
// 					var nodes = [], p = s.nextSibling, root = s.parentNode;
// 					while (p && p !== e) {
// 						nodes.push(p);
// 						p = p.nextSibling;
// 					}
// 					if (!p) { d.remove(); return; }
// 					// DOM already referenced by a rendered host/text VNode belongs to
// 					// the client. A suspended component's fallback pointer does not.
// 					while (root && !root.__k) root = root.parentNode;
// 					var owned = new Set();
// 					function visit(vnode) {
// 						if (vnode) {
// 							if (typeof vnode.type !== 'function' && vnode.__e && vnode.__e.parentNode === s.parentNode) owned.add(vnode.__e);
// 							if (vnode.__k) vnode.__k.forEach(visit);
// 						}
// 					}
// 					if (root) visit(root.__k);
// 					if (nodes.some(node => owned.has(node))) {
// 						var depth = 0;
// 						nodes.forEach(node => {
// 							if (node.nodeType === 8 && node.data.startsWith('$s')) depth++;
// 							else if (node.nodeType === 8 && node.data.startsWith('/$s')) depth--;
// 							else if (!depth && !owned.has(node)) node.remove();
// 						});
// 						d.remove();
// 						return;
// 					}
// 					p = e.previousSibling;
// 					while (p != s) {
// 						if (!p || p == s) break;
// 						e.parentNode.removeChild(p);
// 						p = e.previousSibling;
// 					}

// 					c = s;
// 					while (d.firstChild) {
// 						s = d.firstChild;
// 						d.removeChild(s);
// 						c.after(s);
// 						c = s;
// 					}

// 					d.parentNode.removeChild(d);
// 				});
// 			} else d.remove();
// 		}
// 	}

// 	customElements.define('preact-island', PreactIslandElement);
// }

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `class e extends HTMLElement{connectedCallback(){var e=this;if(!e.isConnected)return;let t=this.getAttribute("data-target");if(t){for(var r,o,n=document.createNodeIterator(document,128);n.nextNode();){let e=n.referenceNode;if(e.data=="$s:"+t?r=e:e.data=="/$s:"+t&&(o=e),r&&o)break}r&&o&&r.parentNode!==document?requestAnimationFrame(()=>{if(e.isConnected&&r.isConnected&&o.isConnected&&r.parentNode===o.parentNode){for(var t=[],a=r.nextSibling,i=r.parentNode;a&&a!==o;)t.push(a),a=a.nextSibling;if(a){for(;i&&!i.__k;)i=i.parentNode;var d=new Set;if(i&&function e(t){t&&("function"!=typeof t.type&&t.__e&&t.__e.parentNode===r.parentNode&&d.add(t.__e),t.__k&&t.__k.forEach(e))}(i.__k),t.some(e=>d.has(e))){var s=0;return t.forEach(e=>{8===e.nodeType&&e.data.startsWith("$s")?s++:8===e.nodeType&&e.data.startsWith("/$s")?s--:s||d.has(e)||e.remove()}),void e.remove()}for(a=o.previousSibling;a!=r&&a&&a!=r;)o.parentNode.removeChild(a),a=o.previousSibling;for(n=r;e.firstChild;)r=e.firstChild,e.removeChild(r),n.after(r),n=r;e.parentNode.removeChild(e)}else e.remove()}else e.remove()}):e.remove()}}}customElements.define("preact-island",e);`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>(function(){${INIT_SCRIPT}}())</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<preact-island hidden data-target="${id}">${content}</preact-island>`;
}
