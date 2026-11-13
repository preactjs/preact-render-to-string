import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// // No optional chaining or logical assignment: the script is inlined as written, so its syntax
// // sets the browser floor.
// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings and ids are unique.
// 	let s,
// 		e,
// 		// comments by their data ("$s?:id" / "/$s:id" for the markers of a pending boundary), so
// 		// each call is a lookup.
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
// 		};
// 	// Each chunk is <template for="id">..</template><script data-p="id">$PRS()</script>: the id is
// 	// an attribute so every chunk script has the same text and one CSP hash covers all of them.
// 	// Native DPU consumes the template while parsing; otherwise $PRS polyfills the patch.
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
// 		s = markers.get("$s?:" + id);
// 		e = markers.get("/$s:" + id);
// 		// hydration may have removed the markers (they stay in the index, detached), and the
// 		// end marker has to be a later sibling of the start marker
// 		for (l = s; l && l != e; l = l.nextSibling);
// 		if (l && e && s.isConnected) {
// 			l = s.nextSibling;
// 			// A pending fallback is wrapped in <?start>..<?end>, which are comments wherever the
// 			// template is still there. The client removes them when it takes the range over, and
// 			// from then on the range is the client's. Without a template native DPU did the patch.
// 			if (!t || (l.nodeType == 8 && l.data[0] == "?")) {
// 				if (t) {
// 					while ((l = s.nextSibling) != e) {
// 						l.remove();
// 					}
// 					e.before(t.content);
// 				}
// 				// DPU cannot patch into svg/math namespaces (needed even with native support), so
// 				// reparse each node between the markers in its parent's namespace.
// 				if (s.parentNode.closest("svg,math")) {
// 					for (n = s.nextSibling; n != e; n = l) {
// 						l = n.nextSibling;
// 						n.outerHTML = n.outerHTML;
// 					}
// 				}
// 				// nested boundaries' markers arrive with this one's content, before the iterator's
// 				// position, so index what is between the markers now (a TreeWalker, unlike a
// 				// NodeIterator, isn't tracked by the document for the rest of its life)
// 				n = d.createTreeWalker(d, 128);
// 				n.currentNode = s;
// 				scan(n, e);
// 				// "$s?" marks a range that still holds its fallback: this one is resolved now
// 				s.data = "$s:" + id;
// 			}
// 		}
// 		// drop the template even when there was nothing to patch
// 		if (t) {
// 			t.remove();
// 		}
// 		c.remove();
// 	};
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t,n,o,r=new Map,i=(e,t,n,o)=>{for(;(n=e.nextNode())&&n!=t;)(o=r.get(n.data))&&o.isConnected||r.set(n.data,n)};window.$PRS=(a=e.currentScript,d=a.dataset.p)=>{let l,s,c=a.previousElementSibling;for(c&&!c.matches('template[for="'+d+'"]')&&(c=null),i(o=o||e.createNodeIterator(e,128)),t=r.get("$s?:"+d),n=r.get("/$s:"+d),l=t;l&&l!=n;l=l.nextSibling);if(l&&n&&t.isConnected&&(l=t.nextSibling,!c||8==l.nodeType&&"?"==l.data[0])){if(c){for(;(l=t.nextSibling)!=n;)l.remove();n.before(c.content)}if(t.parentNode.closest("svg,math"))for(s=t.nextSibling;s!=n;s=l)l=s.nextSibling,s.outerHTML=s.outerHTML;s=e.createTreeWalker(e,128),s.currentNode=t,i(s,n),t.data="$s:"+d}c&&c.remove(),a.remove()}})(document);`;

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

/** Mark an already-flushed fallback for client rendering. */
export function createClientRenderInstruction(id, nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>(function(i){var n,c=document.createNodeIterator(document,128);while(c.nextNode()){n=c.referenceNode;if(n.data==='$s?:'+i){n.data='$s!:'+i;break}}})(${JSON.stringify(String(id)).replace(/</g, '\\u003c')})</script>`;
}
