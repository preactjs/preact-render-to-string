import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// // Inlined as written: no optional chaining or logical assignment
// ((d) => {
// 	let s,
// 		e,
// 		// markers by their data; the first one in the document wins (reparsing a
// 		// namespace recreates nested markers)
// 		markers = new Map(),
// 		// one iterator over the document's comments, resumed on each call
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
// 		};
// 	// when the response ends, boundaries still waiting go to the client, and
// 	// unmounted ranges are removed
// 	d.addEventListener("DOMContentLoaded", () => {
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
// 	// each chunk is <template for="id">..</template><script data-p="id">$PRS()</script>:
// 	// the same script text everywhere, so one CSP hash covers it. Native DPU
// 	// streams the template into the range, otherwise $PRS patches it. data-x
// 	// without a template hands the range to the client.
// 	window.$PRS = (c = d.currentScript, id = c.dataset.p) => {
// 		let t = c.previousElementSibling,
// 			n,
// 			l;
// 		if (t && !t.matches('template[for="' + id + '"]')) {
// 			t = null;
// 		}
// 		// index the markers parsed since the last call
// 		scan((comments = comments || d.createNodeIterator(d, 128)));
// 		s = markers.get("$s?" + id);
// 		// find the closer by id: the streamed content can hold unclosed ranges
// 		e = markers.get("/$s?" + id);
// 		// skip a range that is out of the document (the closer must be a sibling)
// 		for (n = e && s; n && n != e; n = n.nextSibling);
// 		if (!n) {
// 			e = n;
// 		}
// 		if (e) {
// 			if (s.__w === 0) {
// 				drop(s, e);
// 			} else if (s.data == "$s?" + id) {
// 				n = s.nextSibling;
// 				// "$s!" when the server asks for it (data-x), or when the template
// 				// was lost and the range still opens with <?start>
// 				if ("x" in c.dataset || (!t && (n.nodeType == 7 || /^[?]start/.test(n.data)))) {
// 					s.data = "$s!";
// 				} else {
// 					// a template that is still there was not patched in by the browser
// 					if (t) {
// 						while ((n = s.nextSibling) != e) {
// 							n.remove();
// 						}
// 						e.before(t.content);
// 					}
// 					// DPU can't patch into svg/math, so reparse the content in its
// 					// namespace, restoring the <image> tags the HTML parser made <img>
// 					if (s.parentNode.closest("svg,math")) {
// 						for (n = s.nextSibling; n != e; n = l) {
// 							l = n.nextSibling;
// 							if (n.nodeType == 1) {
// 								n.outerHTML = n.outerHTML.replace(/<img([^>]*)>/g, "<image$1/>");
// 							}
// 						}
// 					}
// 					// index the nested markers that arrived with the content (a TreeWalker
// 					// isn't tracked by the document like a NodeIterator)
// 					n = d.createTreeWalker(d, 128);
// 					n.currentNode = s;
// 					scan(n, e);
// 					// "$s=": the content is all there, hydration can take it
// 					s.data = "$s=";
// 				}
// 				// a boundary that is waiting to hydrate this range left a callback
// 				if (s.__w) {
// 					s.__w();
// 				}
// 			}
// 		}
// 		// drop the template even when there was nothing to patch
// 		if (t) {
// 			t.remove();
// 		}
// 		c.remove();
// 	};
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and minify it
// (`esbuild --minify --target=es2017` or https://try.terser.org/).
const INIT_SCRIPT = `(o=>{let r,a,l=new Map,s,f=(t,n,i,e)=>{for(;(i=t.nextNode())&&i!=n;)e=l.get(i.data),(!e||!e.isConnected)&&l.set(i.data,i)},d=(t,n,i)=>{for(;(i=t.nextSibling)!=n;)i.remove();n.remove(),t.remove()};o.addEventListener("DOMContentLoaded",()=>{f(s=s||o.createNodeIterator(o,128)),l.forEach(t=>{if(t.__w===0){for(a=t;a&&a.data!="/"+t.data;a=a.nextSibling);a&&d(t,a)}else t.__w&&t.data[2]=="?"&&(t.data="$s!",t.__w())})}),window.$PRS=(t=o.currentScript,n=t.dataset.p)=>{let i=t.previousElementSibling,e,g;for(i&&!i.matches('template[for="'+n+'"]')&&(i=null),f(s=s||o.createNodeIterator(o,128)),r=l.get("$s?"+n),a=l.get("/$s?"+n),e=a&&r;e&&e!=a;e=e.nextSibling);if(e||(a=e),a){if(r.__w===0)d(r,a);else if(r.data=="$s?"+n){if(e=r.nextSibling,"x"in t.dataset||!i&&(e.nodeType==7||/^[?]start/.test(e.data)))r.data="$s!";else{if(i){for(;(e=r.nextSibling)!=a;)e.remove();a.before(i.content)}if(r.parentNode.closest("svg,math"))for(e=r.nextSibling;e!=a;e=g)g=e.nextSibling,e.nodeType==1&&(e.outerHTML=e.outerHTML.replace(/<img([^>]*)>/g,"<image$1/>"));e=o.createTreeWalker(o,128),e.currentNode=r,f(e,a),r.data="$s="}r.__w&&r.__w()}}i&&i.remove(),t.remove()}})(document);`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>${INIT_SCRIPT}</script>`;
}

/**
 * The browser streams the template into the `<?start name="id">` range, and
 * the script tells hydration it is there.
 * @param {string} id
 * @param {string} content
 * @param {string} [nonce]
 * @returns {string}
 */
export function createSubtree(id, content, nonce) {
	return `<template for="${id}">${content}</template><script data-p="${id}"${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>$PRS()</script>`;
}

/**
 * Leave a boundary whose fallback is in the response to the client.
 * @param {string} id
 * @param {string} [nonce]
 * @returns {string}
 */
export function createClientRenderInstruction(id, nonce) {
	return `<script data-p="${id}" data-x${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>$PRS()</script>`;
}
