/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// function initPreactIslandElement() {
// 	let observer = new MutationObserver((mutations) => {
// 		for (let mutation of mutations) {
// 			for (let node of mutation.addedNodes) {
// 				if (node.nodeName === "TEMPLATE") {
// 					let id = node.getAttribute("for");
// 					if (id) {
// 						var s,
// 			 				e,
// 			 				c = document.createNodeIterator(document, 128);
// 			 			while (c.nextNode()) {
// 			 				let n = c.referenceNode;

// 			 				if (n.data == '?start name="' + id + '"') s = n;
// 			 				else if (n.data == '?end name="' + id + '"') e = n;
// 			 				if (s && e) break;
// 			 			}
// 						if (s && e) {
// 							requestAnimationFrame(() => {
// 								let p = e.previousSibling;
// 								while (p != s) {
// 									if (!p || p == s) break;
// 									e.parentNode.removeChild(p);
// 									p = e.previousSibling;
// 								}
// 								// TODO: flush this out to better polyfill the browser behavior,
// 								// this is pretty basic but works as a x-browser POC
// 								let n = document.createElement("template");
// 								s.replaceWith(n);
// 								n.insertAdjacentHTML("beforebegin", node.innerHTML);
// 								n.remove();
// 							});
// 						}
// 					}
// 				}
// 			}
// 		}
// 	});
// 	observer.observe(document.body, { childList: true, subtree: true });
// 	addEventListener("DOMContentLoaded", () => {
// 		observer.disconnect();
// 	});
// }

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `let e=new MutationObserver(e=>{for(let n of e)for(let e of n.addedNodes)if("TEMPLATE"===e.nodeName){let n=e.getAttribute("for");if(n){for(var t,r,o=document.createNodeIterator(document,128);o.nextNode();){let e=o.referenceNode;if(e.data=='?start name="'+n+'"'?t=e:e.data=='?end name="'+n+'"'&&(r=e),t&&r)break}t&&r&&requestAnimationFrame(()=>{let o=r.previousSibling;for(;o!=t&&o&&o!=t;)r.parentNode.removeChild(o),o=r.previousSibling;let n=document.createElement("template");t.replaceWith(n),n.insertAdjacentHTML("beforebegin",e.innerHTML),n.remove()})}}});e.observe(document.body,{childList:!0,subtree:!0}),addEventListener("DOMContentLoaded",()=>{e.disconnect()});`;

export function createInitScript() {
	return `<script>(function(){${INIT_SCRIPT}}())</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<template for="${id}">${content}</template>`;
}
