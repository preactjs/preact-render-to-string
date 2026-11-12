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
// 		// index the comments that the iterator or walker `w` yields, until `end` (or the last one)
// 		scan = (w, end, n) => {
// 			while ((n = w.nextNode()) != end) {
// 				markers[n.data] ||= n;
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
// 		};
// 	// Each chunk is <template for="id">..</template><script data-p="id">$PRS()</script>: the id is
// 	// an attribute so every chunk script has the same text and one CSP hash covers all of them.
// 	// Native DPU consumes the template while parsing; otherwise $PRS polyfills the patch.
// 	// When only native DPU is supported, `t` is always null, so the whole `if (t) { .. }` polyfill
// 	// branch (and the `t` lookup below) can be removed, leaving only the fixups in the else branches.
// 	window.$PRS = (c = d.currentScript, id = c.dataset.p) => {
// 		let
// 			// the template is emitted right before its script (a document-wide query would rescan
// 			// everything that was streamed so far on every call)
// 			t = c.previousElementSibling,
// 			l,
// 			n;
// 		if (!t?.matches('template[for="' + id + '"]')) {
// 			t = null;
// 		}
// 		// index the markers parsed since the last call
// 		scan((comments ||= d.createNodeIterator(d, 128)));
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
// 				n = l == e && [t.content];
// 			} else {
// 				// native DPU: client DOM that the swap detached has to be put back
// 				n = owned.filter((x) => x && !x.parentNode);
// 			}
// 			// `n` holds what belongs between the markers (the template content, or the detached
// 			// client DOM), and is empty/false when the range has to stay as it is
// 			if (n[0]) {
// 				while ((l = s.nextSibling) != e) {
// 					l.remove();
// 				}
// 				e.before(...n);
// 			}
// 			// DPU cannot patch into svg/math namespaces (needed even with native support), so reparse
// 			// each node between the markers in its parent's namespace. Only server content is reparsed:
// 			// the polyfill just inserted it (t and n[0]) or native DPU did and no client DOM came back.
// 			if (!t == !n[0] && s.parentNode.closest("svg,math")) {
// 				for (n = s.nextSibling; n != e; n = l) {
// 					l = n.nextSibling;
// 					n.outerHTML = n.outerHTML;
// 				}
// 			}
// 			// nested boundaries' markers arrive with this one's content, before the iterator's
// 			// position, so index what is between the markers now (a TreeWalker, unlike a
// 			// NodeIterator, isn't tracked by the document for the rest of its life)
// 			n = d.createTreeWalker(d, 128);
// 			n.currentNode = s;
// 			scan(n, e);
// 		}
// 		// drop the template even when there was nothing to patch
// 		t?.remove();
// 		c.remove();
// 	};
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t,r,o,n,i={},a=(e,t,r)=>{for(;(r=e.nextNode())!=t;)i[r.data]||=r},l=e=>{e&&(t.push(e.__e),(e.type?.call||e.__e?.contains(r))&&e.__k?.forEach(l))};window.$PRS=(d=e.currentScript,c=d.dataset.p)=>{let f,s,p=d.previousElementSibling;if(p?.matches('template[for="'+c+'"]')||(p=null),a(n||=e.createNodeIterator(e,128)),r=i["$s:"+c],o=i["/$s:"+c],r?.isConnected&&r.parentNode==o?.parentNode){for(t=[],s=r.parentNode;s&&!s.__k;)s=s.parentNode;if(l(s?.__k),p){for(f=r;(f=f.nextSibling)&&f!=o&&!t.includes(f););s=f==o&&[p.content]}else s=t.filter(e=>e&&!e.parentNode);if(s[0]){for(;(f=r.nextSibling)!=o;)f.remove();o.before(...s)}if(!p==!s[0]&&r.parentNode.closest("svg,math"))for(s=r.nextSibling;s!=o;s=f)f=s.nextSibling,s.outerHTML=s.outerHTML;s=e.createTreeWalker(e,128),s.currentNode=r,a(s,o)}p?.remove(),d.remove()}})(document);`;

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
	return `<template for="${id}">${content}</template><script data-p="${id}"${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>$PRS()</script>`;
}
