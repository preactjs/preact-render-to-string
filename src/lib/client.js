import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// // No optional chaining or logical assignment: the script is inlined as written, so its syntax
// // sets the browser floor.
// ((d) => {
// 	let s,
// 		e,
// 		// comments by their data ("$s?id" opens a pending range and "/$s?id" closes
// 		// it), so each call is a lookup. The first one seen wins for as long as it
// 		// is in the document: reparsing a namespace recreates the markers of nested
// 		// boundaries.
// 		markers = new Map(),
// 		// one live iterator over the document's comments: created on the first
// 		// call and resumed by every later one, so each comment is visited once
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
// 		// The client unmounted a boundary while it was pending and left its
// 		// markers for us (`__w` is 0): drop them with what is in between.
// 		drop = (s, e, n) => {
// 			while ((n = s.nextSibling) != e) {
// 				n.remove();
// 			}
// 			e.remove();
// 			s.remove();
// 		};
// 	// When the response ends, a chunk that never arrived, or only in part,
// 	// can't clear such a range. And a boundary still waiting for its chunk
// 	// is left to the client ("$s!").
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
// 	// Each chunk is <template for="id">..</template><script data-p="id">$PRS()</script>:
// 	// the id is an attribute so every chunk script has the same text and one CSP
// 	// hash covers all of them. Native DPU consumes the template while parsing and
// 	// streams it into the range; otherwise $PRS polyfills the patch. A script
// 	// with data-x and no template hands the range to the client.
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
// 		// A pending range closes with its id: what streams into it can hold
// 		// ranges that are not closed yet, so counting markers would not find it.
// 		e = markers.get("/$s?" + id);
// 		// The range may sit in a subtree the client took out of the document for
// 		// now. The browser does not patch it there, so the template is still here.
// 		// The closing marker has to be a later sibling of the opening one.
// 		for (n = e && s; n && n != e; n = n.nextSibling);
// 		if (!n) {
// 			e = n;
// 		}
// 		if (e) {
// 			if (s.__w === 0) {
// 				drop(s, e);
// 			} else if (s.data == "$s?" + id) {
// 				n = s.nextSibling;
// 				// "$s!": the client renders this boundary. The server asks for it
// 				// with data-x. It is also all that is left when the chunk is lost:
// 				// there is no template, yet the range still opens with <?start>
// 				// (hydrating a whole document removes a template it finds half
// 				// parsed in <body>, and the browser doesn't patch without one).
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
// 					// DPU cannot patch into svg/math namespaces (needed even with
// 					// native support), so reparse each element in its parent's
// 					// namespace. The HTML parser turned every <image> into an <img>,
// 					// which the svg namespace doesn't know: write it back (an HTML
// 					// <img> below a foreignObject parses as <img> again).
// 					if (s.parentNode.closest("svg,math")) {
// 						for (n = s.nextSibling; n != e; n = l) {
// 							l = n.nextSibling;
// 							if (n.nodeType == 1) {
// 								n.outerHTML = n.outerHTML.replace(/<img([^>]*)>/g, "<image$1/>");
// 							}
// 						}
// 					}
// 					// nested boundaries' markers arrive with this one's content, before
// 					// the iterator's position, so index what is between the markers now
// 					// (a TreeWalker, unlike a NodeIterator, isn't tracked by the document
// 					// for the rest of its life)
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
 * The content of a boundary: the browser streams the template into the range
 * that `<?start name="id">` opens, and the script tells hydration it is there.
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
