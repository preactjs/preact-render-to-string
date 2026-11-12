import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// // No optional chaining or logical assignment: the script is inlined as written, so its syntax
// // sets the browser floor.
// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings and ids are unique.
// 	let owned,
// 		s,
// 		e,
// 		// comments by their data ("$s:id" / "/$s:id" for the markers), so each call is a lookup.
// 		// The first one seen wins for as long as it is in the document: reparsing a namespace
// 		// recreates the markers of nested boundaries.
// 		markers = new Map(),
// 		// one live iterator over the document's comments: created on the first call and resumed
// 		// by every later one, so each comment of the document is only visited once
// 		comments,
// 		// index the comments that the iterator or walker `w` yields, until `end` (or the last one)
// 		scan = (w, end, n, m) => {
// 			while ((n = w.nextNode()) && n != end) {
// 				m = markers.get(n.data);
// 				if (!m || !m.isConnected) {
// 					markers.set(n.data, n);
// 				}
// 			}
// 		},
// 		// walk a vnode tree (__k = children) and record each vnode's DOM node (__e) in `owned`.
// 		// Only the boundary's siblings are looked up, so an element vnode is only entered when it is
// 		// an ancestor of the boundary: nothing below another element renders into its parent.
// 		// Components and Fragments (function types) render into their parent's DOM.
// 		visit = (v) => {
// 			if (v) {
// 				owned.push(v.__e);
// 				if ((typeof v.type == "function" || (v.__e && v.__e.contains(s))) && v.__k) {
// 					v.__k.forEach(visit);
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
// 		if (t && !t.matches('template[for="' + id + '"]')) {
// 			t = null;
// 		}
// 		// index the markers parsed since the last call
// 		scan((comments = comments || d.createNodeIterator(d, 128)));
// 		s = markers.get("$s:" + id);
// 		e = markers.get("/$s:" + id);
// 		// hydration may have removed the markers (they stay in the index, detached),
// 		// and a lone end marker is no boundary
// 		if (s && e && s.isConnected && s.parentNode == e.parentNode) {
// 			// collect the DOM every vnode under the nearest client root points at
// 			owned = [];
// 			for (n = s.parentNode; n && !n.__k; ) {
// 				n = n.parentNode;
// 			}
// 			visit(n && n.__k);
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
// 		if (t) {
// 			t.remove();
// 		}
// 		c.remove();
// 	};
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t,n,o,r,i=new Map,a=(e,t,n,o)=>{for(;(n=e.nextNode())&&n!=t;)(o=i.get(n.data))&&o.isConnected||i.set(n.data,n)},d=e=>{e&&(t.push(e.__e),("function"==typeof e.type||e.__e&&e.__e.contains(n))&&e.__k&&e.__k.forEach(d))};window.$PRS=(l=e.currentScript,c=l.dataset.p)=>{let f,s,p=l.previousElementSibling;if(p&&!p.matches('template[for="'+c+'"]')&&(p=null),a(r=r||e.createNodeIterator(e,128)),n=i.get("$s:"+c),o=i.get("/$s:"+c),n&&o&&n.isConnected&&n.parentNode==o.parentNode){for(t=[],s=n.parentNode;s&&!s.__k;)s=s.parentNode;if(d(s&&s.__k),p){for(f=n;(f=f.nextSibling)&&f!=o&&!t.includes(f););s=f==o&&[p.content]}else s=t.filter(e=>e&&!e.parentNode);if(s[0]){for(;(f=n.nextSibling)!=o;)f.remove();o.before(...s)}if(!p==!s[0]&&n.parentNode.closest("svg,math"))for(s=n.nextSibling;s!=o;s=f)f=s.nextSibling,s.outerHTML=s.outerHTML;s=e.createTreeWalker(e,128),s.currentNode=n,a(s,o)}p&&p.remove(),l.remove()}})(document);`;

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
