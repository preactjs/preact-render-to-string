import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// // Inlined as written: no optional chaining or logical assignment
// ((d) => {
// 	// only the first copy of this script runs
// 	if (customElements.get("preact-island")) {
// 		return;
// 	}
// 	let s,
// 		e,
// 		// markers by their data; the first one in the document wins (reparsing a
// 		// namespace recreates nested markers)
// 		markers = new Map(),
// 		// one iterator over the document's comments, resumed on each patch
// 		comments,
// 		// index the comments that the iterator or walker `w` yields, until `end`
// 		scan = (w, end, n, m) => {
// 			while ((n = w.nextNode()) && n != end) {
// 				m = markers.get(n.data);
// 				if (!m || !m.isConnected) {
// 					markers.set(n.data, n);
// 				}
// 			}
// 		},
// 		// remove a range the client unmounted while pending (`__w` is 0)
// 		drop = (s, e, n) => {
// 			while ((n = s.nextSibling) != e) {
// 				n.remove();
// 			}
// 			e.remove();
// 			s.remove();
// 		},
// 		// Move an island's content into the range of its boundary
// 		patch = (c, id, n, l) => {
// 			id = c.dataset.target;
// 			// index the markers parsed since the last patch
// 			scan((comments = comments || d.createNodeIterator(d, 128)));
// 			s = markers.get("$s?" + id);
// 			e = markers.get("/$s?" + id);
// 			// skip a range that is out of the document (the closer must be a sibling)
// 			for (n = e && s; n && n != e; n = n.nextSibling);
// 			if (n) {
// 				if (s.__w === 0) {
// 					drop(s, e);
// 				} else if (s.data == "$s?" + id) {
// 					// "$s!": the client renders this boundary
// 					if ("x" in c.dataset) {
// 						s.data = "$s!";
// 					} else {
// 						while ((n = s.nextSibling) != e) {
// 							n.remove();
// 						}
// 						while ((n = c.firstChild)) {
// 							e.before(n);
// 						}
// 						// reparse content below svg/math in its namespace, restoring the <image>
// 						// tags the HTML parser turned into <img>
// 						if (s.parentNode.closest("svg,math")) {
// 							for (n = s.nextSibling; n != e; n = l) {
// 								l = n.nextSibling;
// 								if (n.nodeType == 1) {
// 									n.outerHTML = n.outerHTML.replace(/<img([^>]*)>/g, "<image$1/>");
// 								}
// 							}
// 						}
// 						// index the nested markers that arrived with the content (a TreeWalker
// 						// isn't tracked by the document like a NodeIterator)
// 						n = d.createTreeWalker(d, 128);
// 						n.currentNode = s;
// 						scan(n, e);
// 						// "$s=": the content is all there, hydration can take it
// 						s.data = "$s=";
// 					}
// 					// a boundary that is waiting to hydrate this range left a callback
// 					if (s.__w) {
// 						s.__w();
// 					}
// 				}
// 			}
// 			// the empty comment that marked the island complete
// 			if ((n = c.nextSibling) && n.nodeType == 8 && !n.data) {
// 				n.remove();
// 			}
// 			c.remove();
// 		};
// 	// when the response ends, cut-off islands and boundaries still waiting go to
// 	// the client, and unmounted ranges are removed
// 	d.addEventListener("DOMContentLoaded", () => {
// 		d.querySelectorAll("preact-island").forEach((c) => {
// 			if (!c.nextSibling) {
// 				c.dataset.x = "";
// 			}
// 			patch(c);
// 		});
// 		scan((comments = comments || d.createNodeIterator(d, 128)));
// 		markers.forEach((m) => {
// 			if (m.__w === 0) {
// 				for (e = m; e && e.data != "/" + m.data; e = e.nextSibling);
// 				if (e) {
// 					drop(m, e);
// 				}
// 			} else if (m.__w && m.data[2] == "?") {
// 				m.data = "$s!";
// 				m.__w();
// 			}
// 		});
// 	});
// 	// each chunk is <preact-island hidden data-target="id">..</preact-island><!---->:
// 	// the island is complete once a node follows it
// 	customElements.define(
// 		"preact-island",
// 		class extends HTMLElement {
// 			connectedCallback() {
// 				let c = this,
// 					o = new MutationObserver(() => {
// 						if (c.nextSibling) {
// 							o.disconnect();
// 							patch(c);
// 						}
// 					});
// 				o.observe(c.parentNode, { childList: true });
// 			}
// 		}
// 	);
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and minify it
// (`esbuild --minify --target=es2017` or https://try.terser.org/).
const INIT_SCRIPT = `(o=>{if(customElements.get("preact-island"))return;let i,a,l=new Map,d,f=(t,r,e,s)=>{for(;(e=t.nextNode())&&e!=r;)s=l.get(e.data),(!s||!s.isConnected)&&l.set(e.data,e)},n=(t,r,e)=>{for(;(e=t.nextSibling)!=r;)e.remove();r.remove(),t.remove()},c=(t,r,e,s)=>{for(r=t.dataset.target,f(d=d||o.createNodeIterator(o,128)),i=l.get("$s?"+r),a=l.get("/$s?"+r),e=a&&i;e&&e!=a;e=e.nextSibling);if(e){if(i.__w===0)n(i,a);else if(i.data=="$s?"+r){if("x"in t.dataset)i.data="$s!";else{for(;(e=i.nextSibling)!=a;)e.remove();for(;e=t.firstChild;)a.before(e);if(i.parentNode.closest("svg,math"))for(e=i.nextSibling;e!=a;e=s)s=e.nextSibling,e.nodeType==1&&(e.outerHTML=e.outerHTML.replace(/<img([^>]*)>/g,"<image$1/>"));e=o.createTreeWalker(o,128),e.currentNode=i,f(e,a),i.data="$s="}i.__w&&i.__w()}}(e=t.nextSibling)&&e.nodeType==8&&!e.data&&e.remove(),t.remove()};o.addEventListener("DOMContentLoaded",()=>{o.querySelectorAll("preact-island").forEach(t=>{t.nextSibling||(t.dataset.x=""),c(t)}),f(d=d||o.createNodeIterator(o,128)),l.forEach(t=>{if(t.__w===0){for(a=t;a&&a.data!="/"+t.data;a=a.nextSibling);a&&n(t,a)}else t.__w&&t.data[2]=="?"&&(t.data="$s!",t.__w())})}),customElements.define("preact-island",class extends HTMLElement{connectedCallback(){let t=this,r=new MutationObserver(()=>{t.nextSibling&&(r.disconnect(),c(t))});r.observe(t.parentNode,{childList:!0})}})})(document)`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>${INIT_SCRIPT}</script>`;
}

/**
 * The island moves this into the `$s?id` range once the comment after it arrives.
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<preact-island hidden data-target="${id}">${content}</preact-island><!---->`;
}

/**
 * Leave a boundary whose fallback is in the response to the client.
 * @param {string} id
 * @returns {string}
 */
export function createClientRenderInstruction(id) {
	return `<preact-island hidden data-target="${id}" data-x></preact-island><!---->`;
}
