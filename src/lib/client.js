import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	let visit = (v) => {
// 		if (v) {
// 			if (typeof v.type != "function" && v.__e) owned.add(v.__e);
// 			if (v.__k) v.__k.forEach(visit);
// 		}
// 	};
// 	let owned;
// 	let initPreactPatch = () => {
// 		let isNotLoading = d.readyState[0] != "l", node, markers, c, s, e, n, id, patched, nodes, depth;
// 		for (node of d.querySelectorAll("template[for]")) {
// 			if (isNotLoading || node.nextSibling) {
// 				if (!markers) {
// 					markers = new Map();
// 					c = d.createNodeIterator(d, 128);
// 					while ((n = c.nextNode())) markers.set(n.data, n);
// 				}
// 				id = node.getAttribute("for");
// 				s = markers.get("$s:" + id);
// 				e = markers.get("/$s:" + id);
// 				if (s && e && s.isConnected && e.isConnected && s.parentNode == e.parentNode && s.parentNode != d) {
// 					// DOM that a client vnode already owns (hydration got here first)
// 					// must survive: only the unowned fallback is dropped.
// 					owned = new Set();
// 					for (n = s.parentNode; n && !n.__k; ) n = n.parentNode;
// 					if (n) visit(n.__k);
// 					nodes = [];
// 					for (n = s.nextSibling; n && n != e; n = n.nextSibling) nodes.push(n);
// 					if (nodes.some((x) => owned.has(x))) {
// 						depth = 0;
// 						nodes.forEach((x) => {
// 							if (x.nodeType == 8 && x.data.startsWith("$s")) depth++;
// 							else if (x.nodeType == 8 && x.data.startsWith("/$s")) depth--;
// 							else if (!depth && !owned.has(x)) x.remove();
// 						});
// 					} else {
// 						nodes.forEach((x) => x.remove());
// 						if (s.parentNode.closest("svg,math")) {
// 							c = d.createRange();
// 							c.setStartAfter(s);
// 							s.after(c.createContextualFragment(node.innerHTML));
// 						} else s.after(node.content);
// 					}
// 					node.remove();
// 					patched = 1;
// 				}
// 			}
// 		}
// 		// patched content can hold markers for templates handled earlier in this pass
// 		if (patched) initPreactPatch();
// 	};
// 	let mo = new MutationObserver(initPreactPatch);
// 	mo.observe(d, { childList: 1, subtree: 1 });
// 	d.addEventListener("DOMContentLoaded", () => { initPreactPatch(); mo.disconnect(); });
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t,r=e=>{e&&("function"!=typeof e.type&&e.__e&&t.add(e.__e),e.__k&&e.__k.forEach(r))},n=()=>{let o,a,d,s,i,f,c,l,p,_,h="l"!=e.readyState[0];for(o of e.querySelectorAll("template[for]"))if(h||o.nextSibling){if(!a)for(a=new Map,d=e.createNodeIterator(e,128);f=d.nextNode();)a.set(f.data,f);if(c=o.getAttribute("for"),s=a.get("$s:"+c),i=a.get("/$s:"+c),s&&i&&s.isConnected&&i.isConnected&&s.parentNode==i.parentNode&&s.parentNode!=e){for(t=new Set,f=s.parentNode;f&&!f.__k;)f=f.parentNode;for(f&&r(f.__k),p=[],f=s.nextSibling;f&&f!=i;f=f.nextSibling)p.push(f);p.some(e=>t.has(e))?(_=0,p.forEach(e=>{8==e.nodeType&&e.data.startsWith("$s")?_++:8==e.nodeType&&e.data.startsWith("/$s")?_--:_||t.has(e)||e.remove()})):(p.forEach(e=>e.remove()),s.parentNode.closest("svg,math")?(d=e.createRange(),d.setStartAfter(s),s.after(d.createContextualFragment(o.innerHTML))):s.after(o.content)),o.remove(),l=1}}l&&n()},o=new MutationObserver(n);o.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",()=>{n(),o.disconnect()})})(document);`;

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
