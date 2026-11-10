import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings and ids are unique.
// 	let owned,
// 		s,
// 		e,
// 		// comments by their data ("$s:id" / "/$s:id" for the markers), so each call is a lookup.
// 		// The first one seen wins, which also keeps keys like "__proto__" from being assigned.
// 		markers = {},
// 		// one live iterator over the document's comments: created on the first call and resumed
// 		// by every later one, so each comment of the document is only visited once
// 		comments,
// 		// index the comments at or below `n`
// 		index = (n) => {
// 			if (n.nodeType == 8) {
// 				markers[n.data] ||= n;
// 			}
// 			for (n = n.firstChild; n; n = n.nextSibling) {
// 				index(n);
// 			}
// 		},
// 		// walk a vnode tree (__k = children) and record each vnode's DOM node (__e) in `owned`.
// 		// Only the boundary's siblings are looked up, so an element vnode is only entered when it is
// 		// an ancestor of the boundary: nothing below another element renders into its parent.
// 		// Components and Fragments (function types) render into their parent's DOM.
// 		visit = (v) => {
// 			if (v) {
// 				owned.push(v.__e);
// 				if (v.type?.call || v.__e?.contains(s)) {
// 					v.__k?.forEach(visit);
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
// 		let c = d.currentScript,
// 			// the template is emitted right before its script (a document-wide query would rescan
// 			// everything that was streamed so far on every call)
// 			t = c.previousElementSibling,
// 			l,
// 			n;
// 		if (!t?.matches('template[for="' + id + '"]')) {
// 			t = null;
// 		}
// 		// index the markers parsed since the last call
// 		comments ||= d.createNodeIterator(d, 128);
// 		while ((l = comments.nextNode())) {
// 			index(l);
// 		}
// 		s = markers["$s:" + id];
// 		e = markers["/$s:" + id];
// 		// hydration may have removed the markers (they stay in the index, detached),
// 		// and a lone end marker is no boundary
// 		if (s?.isConnected && s.parentNode == e?.parentNode) {
// 			// collect the DOM every vnode under the nearest client root points at
// 			owned = [];
// 			for (n = s.parentNode; n && !n.__k; ) {
// 				n = n.parentNode;
// 			}
// 			visit(n?.__k);
// 			if (t) {
// 				// polyfill only (no native DPU): `t` is null when the browser already swapped the range.
// 				// DOM that a client vnode already owns (hydration got here first)
// 				// must survive, so leave the boundary alone and only drop the template.
// 				for (l = s; (l = l.nextSibling) && l != e && !owned.includes(l); );
// 				if (l == e) {
// 					clear(s, e);
// 					s.after(t.content);
// 					fixNamespace(s, e);
// 				}
// 			} else {
// 				n = owned.filter((x) => x && !x.parentNode);
// 				if (n[0]) {
// 					// native DPU detached client DOM: put it back and drop the server content
// 					clear(s, e);
// 					e.before(...n);
// 				} else {
// 					fixNamespace(s, e);
// 				}
// 			}
// 			// nested boundaries' markers arrive with this one's content, before the iterator's
// 			// position, so index what is between the markers now
// 			for (l = s; (l = l.nextSibling) != e; ) {
// 				index(l);
// 			}
// 		}
// 		// drop the template even when there was nothing to patch
// 		t?.remove();
// 		c.remove();
// 	};
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t,n,o,r,i={},l=e=>{for(8==e.nodeType&&(i[e.data]||=e),e=e.firstChild;e;e=e.nextSibling)l(e)},a=e=>{e&&(t.push(e.__e),(e.type?.call||e.__e?.contains(n))&&e.__k?.forEach(a))},f=(e,t)=>{let n,o;if(e.parentNode.closest("svg,math"))for(n=e.nextSibling;n!=t;n=o)o=n.nextSibling,n.outerHTML=n.outerHTML},d=(e,t,n)=>{for(;(n=e.nextSibling)!=t;)n.remove()};window.$PRS=s=>{let c,p,_=e.currentScript,S=_.previousElementSibling;for(S?.matches('template[for="'+s+'"]')||(S=null),r||=e.createNodeIterator(e,128);c=r.nextNode();)l(c);if(n=i["$s:"+s],o=i["/$s:"+s],n?.isConnected&&n.parentNode==o?.parentNode){for(t=[],p=n.parentNode;p&&!p.__k;)p=p.parentNode;if(a(p?.__k),S){for(c=n;(c=c.nextSibling)&&c!=o&&!t.includes(c););c==o&&(d(n,o),n.after(S.content),f(n,o))}else p=t.filter(e=>e&&!e.parentNode),p[0]?(d(n,o),o.before(...p)):f(n,o);for(c=n;(c=c.nextSibling)!=o;)l(c)}S?.remove(),_.remove()}})(document);`;

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
