import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings and ids are unique.
// 	let owned,
// 		// walk a vnode tree (__k = children) and record each vnode's DOM node (__e) in `owned`
// 		visit = (v) => {
// 			if (v) {
// 				owned.add(v.__e);
// 				if (v.__k) {
// 					v.__k.forEach(visit);
// 				}
// 			}
// 		},
// 		// DPU cannot patch into svg/math namespaces (needed even with native support),
// 		// so reparse each node between the markers in its parent's namespace.
// 		fixNamespace = (s, e) => {
// 			let n, next;
// 			if (s.parentNode.closest("svg,math")) {
// 				for (n = s.nextSibling; n != e; n = next) {
// 					next = n.nextSibling;
// 					n.outerHTML = n.outerHTML;
// 				}
// 			}
// 		},
// 		clear = (s, e, n) => {
// 			while ((n = s.nextSibling) != e) {
// 				n.remove();
// 			}
// 		};
// 	// Each chunk is <template for="id">..</template><script>$PRS("id")</script>.
// 	// Native DPU consumes the template while parsing; otherwise $PRS polyfills the patch.
// 	// When only native DPU is supported, `t` is always null, so the whole `if (t) { .. }` polyfill
// 	// branch (and the `t` lookup below) can be removed, leaving only the fixups in the else branches.
// 	window.$PRS = (id) => {
// 		let t = d.querySelector('template[for="' + id + '"]'),
// 			s = 0,
// 			e = 0,
// 			l,
// 			n,
// 			c = d.createNodeIterator(d, 128);
// 		// find this boundary's markers, stopping as soon as both are found
// 		while ((l = c.nextNode()) && !(s && e)) {
// 			if (l.data == "$s:" + id) {
// 				s = l;
// 			} else if (l.data == "/$s:" + id) {
// 				e = l;
// 			}
// 		}
// 		if (e) {
// 			// collect the DOM every vnode under the nearest client root points at
// 			owned = new Set();
// 			for (n = s.parentNode; n && !n.__k; ) {
// 				n = n.parentNode;
// 			}
// 			visit(n?.__k);
// 			if (t) {
// 				// polyfill only (no native DPU): `t` is null when the browser already swapped the range.
// 				// DOM that a client vnode already owns (hydration got here first)
// 				// must survive, so leave the boundary alone and only drop the template.
// 				for (l = s; (l = l.nextSibling) && l != e && !owned.has(l); );
// 				if (l == e) {
// 					clear(s, e);
// 					s.after(t.content);
// 					fixNamespace(s, e);
// 				}
// 				t.remove();
// 			} else {
// 				n = [...owned].filter((x) => x && !x.parentNode);
// 				if (n[0]) {
// 					// native DPU detached client DOM: put it back and drop the server content
// 					clear(s, e);
// 					e.before(...n);
// 				} else {
// 					fixNamespace(s, e);
// 				}
// 			}
// 		}
// 		d.currentScript.remove();
// 	};
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let r,f=e=>e&&(r.add(e.__e),e.__k&&e.__k.forEach(f)),l=(n,t)=>{let f,L;if(n.parentNode.closest("svg,math"))for(f=n.nextSibling;f!=t;f=L)L=f.nextSibling,f.outerHTML=f.outerHTML},c=(n,t,a)=>{for(;(a=n.nextSibling)!=t;)a.remove()};window.$PRS=d=>{let t=e.querySelector('template[for="'+d+'"]'),s=0,n=0,a,i=e.createNodeIterator(e,128),o;for(;(a=i.nextNode())&&!(s&&n);)a.data=="$s:"+d?s=a:a.data=="/$s:"+d&&(n=a);if(n){for(o=s.parentNode,r=new Set;o&&!o.__k;)o=o.parentNode;if(f(o?.__k),t){for(a=s;(a=a.nextSibling)&&a!=n&&!r.has(a););a==n&&(c(s,n),s.after(t.content),l(s,n)),t.remove()}else(o=[...r].filter(x=>x&&!x.parentNode))[0]?(c(s,n),n.before(...o)):l(s,n)}e.currentScript.remove()}})(document);`;

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
 * @param {string} [nonce]
 * @returns {string}
 */
export function createSubtree(id, content, nonce) {
	return `<template for="${id}">${content}</template><script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>$PRS("${id}")</script>\n`;
}
