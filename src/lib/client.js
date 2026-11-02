import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings, ids are unique numbers,
// 	// and a template never arrives before the outer boundary it patches into.
// 	let owned, lost,
// 		visit = (v) =>
// 			v && (v.__e && (owned.add(v.__e), v.__e.parentNode || lost.add(v.__e)), v.__k && v.__k.forEach(visit)),
// 		// collect the DOM every vnode under the nearest client root points at,
// 		// and separately the part of it that is detached (no parent left)
// 		collect = (s) => {
// 			let n = s.parentNode;
// 			owned = new Set();
// 			lost = new Set();
// 			while (n && !n.__k) n = n.parentNode;
// 			visit(n?.__k);
// 		},
// 		// DPU cannot patch into svg/math namespaces (needed even with native support),
// 		// so reparse each node between the markers in its parent's namespace.
// 		fixNamespace = (s, e) => {
// 			let n, next;
// 			if (s.parentNode.closest("svg,math"))
// 				for (n = s.nextSibling; n != e; n = next) (next = n.nextSibling), (n.outerHTML = n.outerHTML);
// 		},
// 		mo = new MutationObserver((records) =>
// 			records.forEach((r) => {
// 				let e = r.nextSibling, s = e, l, id;
// 				// Native DPU replaces the <?start>..<?end> range itself and consumes the template,
// 				// so the polyfill below never sees a template there. The <?end> removal is the signal,
// 				// and it is only valid when it sits right before the "/$s:<id>" end boundary.
// 				if (r.removedNodes[0]?.nodeName == "end" && e?.data?.startsWith("/$s:")) {
// 					id = e.data.slice(1);
// 					while ((s = s.previousSibling) && s.data != id);
// 					if (s) {
// 						collect(s);
// 						// client DOM that the swap detached must survive:
// 						// put it back and drop the server content
// 						if (lost.size) {
// 							while ((l = s.nextSibling) != e) l.remove();
// 							e.before(...lost);
// 						} else fixNamespace(s, e);
// 					}
// 				}
// 				// Polyfill: a template is closed once the node after it arrives.
// 				r.addedNodes.forEach((node) => {
// 					if ((node = node.previousSibling) && node.content) {
// 						let id = node.getAttribute("for"),
// 						c = d.createNodeIterator(d, 128);
// 						// find this boundary's markers, stopping as soon as both are found
// 						for (s = e = 0; (l = c.nextNode()) && !(s && e); )
// 							l.data == "$s:" + id ? (s = l) : l.data == "/$s:" + id && (e = l);
// 						if (e) {
// 							// DOM that a client vnode already owns (hydration got here first)
// 							// must survive, so leave the boundary alone and only drop the template.
// 							for (collect(s), l = s; (l = l.nextSibling) && l != e && !owned.has(l); );
// 							if (l == e) {
// 								while ((l = s.nextSibling) != e) l.remove();
// 								s.after(node.content);
// 								fixNamespace(s, e);
// 							}
// 							node.remove();
// 						}
// 					}
// 				});
// 			}),
// 		);
// 	mo.observe(d, { childList: 1, subtree: 1 });
// 	d.addEventListener("DOMContentLoaded", () => mo.disconnect());
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let r,u,f=e=>e&&(r.add(e.__e),null===e.__e?.parentNode&&u.add(e.__e),e.__k&&e.__k.forEach(f)),b=n=>{let a=n.parentNode;for(r=new Set,u=new Set;a&&!a.__k;)a=a.parentNode;f(a?.__k)},h=(n,t)=>{let f,L;if(n.parentNode.closest("svg,math"))for(f=n.nextSibling;f!=t;f=L)L=f.nextSibling,f.outerHTML=f.outerHTML},g=new MutationObserver(k=>k.forEach(o=>{let t=o.nextSibling,n=t,s,a,i;if("end"==o.removedNodes[0]?.nodeName&&"/"==t?.data?.[0]){for(i=t.data.slice(1);(n=n.previousSibling)&&n.data!=i;);if(n)if(b(n),u.size){for(;(a=n.nextSibling)!=t;)a.remove();t.before(...u)}else h(n,t)}o.addedNodes.forEach(d=>{let i,L;if((d=d.previousSibling)&&d.content){for(i=d.getAttribute("for"),L=e.createNodeIterator(e,128),n=t=0;(a=L.nextNode())&&!(n&&t);)a.data=="$s:"+i?n=a:a.data=="/$s:"+i&&(t=a);if(t){for(b(n),a=n;(a=a.nextSibling)&&a!=t&&!r.has(a););if(a==t){for(;(a=n.nextSibling)!=t;)a.remove();n.after(d.content),h(n,t)}d.remove()}}})}));g.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",()=>g.disconnect())})(document);`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>${INIT_SCRIPT}</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	// The trailing newline is a sibling node that tells the init script the
	// parser has closed the template, so it can patch before the stream ends.
	return `<template for="${id}">${content}</template>\n`;
}
