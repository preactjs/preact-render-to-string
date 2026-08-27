import { encodeEntities } from "./util.js"

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// (function initPreactPatch(d) {
// 	if ("htmlFor" in HTMLTemplateElement.prototype) return;
// 	new MutationObserver(function (records) {
// 		for (let record of records) {
// 			for (let node of record.addedNodes) {
// 				if (node.nodeName == "TEMPLATE" && node.getAttribute("for")) {
// 					let s,
// 						e,
// 						c = d.createNodeIterator(d, 128),
// 						id = node.getAttribute("for");
// 					while (c.nextNode()) {
// 						let n = c.referenceNode;
// 						if (n.data == "$s:" + id) s = n;
// 						else if (n.data == "/$s:" + id) e = n;
// 						if (s && e) break;
// 					}
// 					if (!s || !e || s.parentNode === d) continue;
// 					let p = s.nextSibling;
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
// 	}).observe(d, { childList: 1, subtree: 1 });
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `var e;e=document,"htmlFor"in HTMLTemplateElement.prototype||new MutationObserver(function(t){for(let o of t)for(let t of o.addedNodes)if("TEMPLATE"==t.nodeName&&t.getAttribute("for")){let o,r,n=e.createNodeIterator(e,128),i=t.getAttribute("for");for(;n.nextNode();){let e=n.referenceNode;if(e.data=="$s:"+i?o=e:e.data=="/$s:"+i&&(r=e),o&&r)break}if(!o||!r||o.parentNode===e)continue;let a=o.nextSibling;for(;a&&a!=r;){let e=a.nextSibling;a.remove(),a=e}o.after(t.content),t.remove()}}).observe(e,{childList:1,subtree:1});`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>(function(){${INIT_SCRIPT}}())</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<template for="${id}">${content}</template>`;
}
