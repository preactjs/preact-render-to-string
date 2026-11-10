import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings and ids are unique.
// 	let owned,
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
// 		let c = d.currentScript,
// 			// the template is emitted right before its script (a document-wide query would rescan
// 			// everything that was streamed so far on every call)
// 			t = c.previousElementSibling,
// 			s,
// 			e,
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
const INIT_SCRIPT = `(e=>{let t,n,o={},r=e=>{for(8==e.nodeType&&(o[e.data]||=e),e=e.firstChild;e;e=e.nextSibling)r(e)},i=e=>{e&&(t.add(e.__e),e.__k&&e.__k.forEach(i))},l=(e,t)=>{let n,o;if(e.parentNode.closest("svg,math"))for(n=e.nextSibling;n!=t;n=o)o=n.nextSibling,n.outerHTML=n.outerHTML},a=(e,t,n)=>{for(;(n=e.nextSibling)!=t;)n.remove()};window.$PRS=d=>{let f,s,p,S,_=e.currentScript,c=_.previousElementSibling;for(c?.matches('template[for="'+d+'"]')||(c=null),n||=e.createNodeIterator(e,128);p=n.nextNode();)r(p);if(f=o["$s:"+d],s=o["/$s:"+d],f?.isConnected&&f.parentNode==s?.parentNode){for(t=new Set,S=f.parentNode;S&&!S.__k;)S=S.parentNode;if(i(S?.__k),c){for(p=f;(p=p.nextSibling)&&p!=s&&!t.has(p););p==s&&(a(f,s),f.after(c.content),l(f,s))}else S=[...t].filter(e=>e&&!e.parentNode),S[0]?(a(f,s),s.before(...S)):l(f,s);for(p=f;(p=p.nextSibling)!=s;)r(p)}c?.remove(),_.remove()}})(document);`;

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
