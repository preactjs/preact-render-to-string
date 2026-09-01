import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// (function initPreactPatch(d) {
// 	if ("htmlFor" in HTMLTemplateElement.prototype) return;
// 	function go() {
// 		for (let node of d.querySelectorAll("template[for]")) {
// 			// Streaming parser can expose <template for> before its children.
// 			// If we apply now, content is empty and removing the node means it
// 			// never completes. Defer until a later sibling arrives or DCL.
// 			if (d.readyState !== "loading" || node.nextElementSibling) {

// 				let s,
// 				e,
// 				p,
// 				c = d.createNodeIterator(d, 128),
// 				id = "$s:" + node.getAttribute("for");
// 				while (c.nextNode()) {
// 					let n = c.referenceNode;
// 					if (n.data == id) s = n;
// 					else if (n.data == "/" + id) e = n;
// 					if (s && e) break;
// 				}
// 				if (s && e && s.parentNode !== d) {
// 					p = s.nextSibling;
// 					while (p && p != e) {
// 						let next = p.nextSibling;
// 						p.remove();
// 						p = next;
// 					}
// 					s.after(node.content);
// 					node.remove();
// 				}
// 			}
// 		}
// 	}
// 	new MutationObserver(go).observe(d, { childList: 1, subtree: 1 });
// 	d.addEventListener("DOMContentLoaded", go);
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `!function(e){function t(){for(let t of e.querySelectorAll("template[for]"))if("loading"!==e.readyState||t.nextElementSibling){let n,o,r,i=e.createNodeIterator(e,128),a="$s:"+t.getAttribute("for");for(;i.nextNode();){let e=i.referenceNode;if(e.data==a?n=e:e.data=="/"+a&&(o=e),n&&o)break}if(n&&o&&n.parentNode!==e){for(r=n.nextSibling;r&&r!=o;){let e=r.nextSibling;r.remove(),r=e}n.after(t.content),t.remove()}}}"htmlFor"in HTMLTemplateElement.prototype||(new MutationObserver(t).observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",t))}(document);`;

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
	return `<template for="${id}">${content}</template>`;
}
