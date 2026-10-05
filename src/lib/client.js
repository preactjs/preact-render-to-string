import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	new MutationObserver((mutations, observer) => {
// 		for (let mutation of mutations) {
// 			for (let node of mutation.addedNodes) {
// 				// find all complete stamps in the DOM
// 				if (node.nodeType == 8 && !node.data.indexOf("$p:")) {
// 					let id = node.data.slice(3), // id of the template to replace
// 					start, // start of the comment
// 					end, // end of the comment
// 					temp, // temp variable for the current node
// 					iter = d.createTreeWalker(d, 128), // tree walker to find the start and end of the comments
// 					hole = "$s:" + id, // start name for the comment to replace
// 					next, // temp variable for the next item
// 					nodes = [],
// 					root,
// 					owned = new Set(),
// 					keep;
// 					// find the start and end of the comments by traversing the tree
// 					for (; (!start || !end) && (temp = iter.nextNode()); ) {
//                       	if(temp.data == hole) start = temp;
//                       	else if(temp.data == "/" + hole) end = temp;
// 					}
// 					temp = d.querySelector('template[for="' + id + '"]');
// 					// if the start and end are found continue
// 					if (start && end && start.parentNode !== d && start.isConnected && end.isConnected && start.parentNode === end.parentNode) {
// 						root = start.parentNode;
// 						next = start.nextSibling;
// 						while (next && next !== end) {
// 							nodes.push(next);
// 							next = next.nextSibling;
// 						}
// 						if (next) {
// 							// DOM already referenced by a rendered host/text VNode belongs to
// 							// the client. A suspended component's fallback pointer does not.
// 							while (root && !root.__k) root = root.parentNode;
// 							function visit(vnode) {
// 								if (vnode) {
// 									if (typeof vnode.type !== 'function' && vnode.__e && vnode.__e.parentNode === start.parentNode) owned.add(vnode.__e);
// 									if (vnode.__k) vnode.__k.forEach(visit);
// 								}
// 							}
// 							if (root) visit(root.__k);
// 							keep = nodes.some(n => owned.has(n));
// 							if (keep) {
// 								let depth = 0;
// 								nodes.forEach(n => {
// 									if (n.nodeType === 8 && n.data.startsWith('$s')) depth++;
// 									else if (n.nodeType === 8 && n.data.startsWith('/$s')) depth--;
// 									else if (!depth && !owned.has(n)) n.remove();
// 								});
// 							} else if (temp) {
// 								// Template is still in the document: native DPU did not apply it.
// 								// Replace the fallback between the markers with the streamed content.
// 								for (; (next = start.nextSibling) && next != end; ) {
// 									next.remove();
// 								}
// 								start.after(temp.content);
// 							}
// 						}
// 					}
// 					if (temp) temp.remove();
// 					node.remove();
// 					// Reparse svg/math so HTML-namespace children (from template/DPU) get the right NS.
// 					// closest() matches the element itself when the hole's parent is <svg>/<math>.
// 					if (next && !keep) (temp = start.parentElement) && (temp = temp.closest("svg,math")) && (temp.innerHTML += "");
// 				}
// 			}
// 		}
// 		d.readyState[0] != "l" && observer.disconnect();
// 	}).observe(d, { childList: 1, subtree: 1 });
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{new MutationObserver((t,o)=>{for(let a of t)for(let r of a.addedNodes)if(8==r.nodeType&&!r.data.indexOf("$p:")){let d,i,s,f,l,p,c=r.data.slice(3),_=e.createTreeWalker(e,128),h="$s:"+c,m=[],N=new Set;for(;(!d||!i)&&(s=_.nextNode());)s.data==h?d=s:s.data=="/"+h&&(i=s);if(s=e.querySelector('template[for="'+c+'"]'),d&&i&&d.parentNode!==e&&d.isConnected&&i.isConnected&&d.parentNode===i.parentNode){for(l=d.parentNode,f=d.nextSibling;f&&f!==i;)m.push(f),f=f.nextSibling;if(f){for(;l&&!l.__k;)l=l.parentNode;function n(e){e&&("function"!=typeof e.type&&e.__e&&e.__e.parentNode===d.parentNode&&N.add(e.__e),e.__k&&e.__k.forEach(n))}if(l&&n(l.__k),p=m.some(e=>N.has(e)),p){let u=0;m.forEach(e=>{8===e.nodeType&&e.data.startsWith("$s")?u++:8===e.nodeType&&e.data.startsWith("/$s")?u--:u||N.has(e)||e.remove()})}else if(s){for(;(f=d.nextSibling)&&f!=i;)f.remove();d.after(s.content)}}}s&&s.remove(),r.remove(),f&&!p&&(s=d.parentElement)&&(s=s.closest("svg,math"))&&(s.innerHTML+="")}"l"!=e.readyState[0]&&o.disconnect()}).observe(e,{childList:1,subtree:1})})(document);`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>!function(){${INIT_SCRIPT}}();</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<template for="${id}">${content}</template><!--$p:${id}-->`;
}
