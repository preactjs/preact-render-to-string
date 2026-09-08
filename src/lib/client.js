import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	let initPreactPatch = () => {
// 	  let isNotLoading = d.readyState[0] != "l", qsa = 'querySelectorAll',node;
//   	  // loop through all <template[for]> and move them
// 	  for ( node of d[qsa]("template[for]")) {
// 		// make sure the template is done streaming in: a later sibling alone is
// 		// not enough (open templates can gain siblings via microtask interleaving
// 		// before children arrive). Require content while the document is loading.
// 		if (isNotLoading || node.nextElementSibling && node.content.childNodes.length) {
// 		  let s, e, n, p, c = d.createNodeIterator(d, 128), id = "$s:" + node.getAttribute("for");
// 		  // find the start and end markers in content
// 		  while ((n = c.nextNode()) && !(s && e)) {
// 			if (n.data == id) s = n;
// 			else if (n.data == "/" + id) e = n;
// 		  }
// 		  // remove the old template and insert the new one
// 		  if (s && e && s.parentNode !== d && s.isConnected && e.isConnected && s.parentNode === e.parentNode) {
// 			let nodes = [], root = s.parentNode, owned = new Set();
// 			p = s.nextSibling;
// 			while (p && p !== e) {
// 			  nodes.push(p);
// 			  p = p.nextSibling;
// 			}
// 			if (p) {
// 			  // DOM already referenced by a rendered host/text VNode belongs to
// 			  // the client. A suspended component's fallback pointer does not.
// 			  while (root && !root.__k) root = root.parentNode;
// 			  function visit(vnode) {
// 				if (vnode) {
// 				  if (typeof vnode.type !== 'function' && vnode.__e && vnode.__e.parentNode === s.parentNode) owned.add(vnode.__e);
// 				  if (vnode.__k) vnode.__k.forEach(visit);
// 				}
// 			  }
// 			  if (root) visit(root.__k);
// 			  if (nodes.some(n => owned.has(n))) {
// 				let depth = 0;
// 				nodes.forEach(n => {
// 				  if (n.nodeType === 8 && n.data.startsWith('$s')) depth++;
// 				  else if (n.nodeType === 8 && n.data.startsWith('/$s')) depth--;
// 				  else if (!depth && !owned.has(n)) n.remove();
// 				});
// 			  } else {
// 				while ((p = s.nextSibling) && p != e) p.remove();
// 				s.after(node.content);
// 			  }
// 			}
// 			node.remove();
// 		  } else if (isNotLoading) node.remove();
// 		}
// 	  }

// 	 // re-parse SVG and MathML elements so they will be rendered correctly
// 	  for ( node of d[qsa]("svg *,math *")) {
// 		if (node.tagName < "a" && (node = node.closest("svg,math"))) {
// 		  node.innerHTML += "";
// 		}
// 	  }

// 	  // disconnect the mutation observer if the document is not loading (complete or interactive)
// 	  if (isNotLoading) mo.disconnect();
// 	};
// 	let mo = new MutationObserver(initPreactPatch);
// 	mo.observe(d, { childList: 1, subtree: 1 });
// 	d.addEventListener("DOMContentLoaded", initPreactPatch);
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t=()=>{let t,n="l"!=e.readyState[0],r="querySelectorAll";for(t of e[r]("template[for]"))if(n||t.nextElementSibling&&t.content.childNodes.length){let d,i,s,l,f=e.createNodeIterator(e,128),c="$s:"+t.getAttribute("for");for(;(s=f.nextNode())&&(!d||!i);)s.data==c?d=s:s.data=="/"+c&&(i=s);if(d&&i&&d.parentNode!==e&&d.isConnected&&i.isConnected&&d.parentNode===i.parentNode){let _=[],p=d.parentNode,h=new Set;for(l=d.nextSibling;l&&l!==i;)_.push(l),l=l.nextSibling;if(l){for(;p&&!p.__k;)p=p.parentNode;function a(e){e&&("function"!=typeof e.type&&e.__e&&e.__e.parentNode===d.parentNode&&h.add(e.__e),e.__k&&e.__k.forEach(a))}if(p&&a(p.__k),_.some(e=>h.has(e))){let m=0;_.forEach(e=>{8===e.nodeType&&e.data.startsWith("$s")?m++:8===e.nodeType&&e.data.startsWith("/$s")?m--:m||h.has(e)||e.remove()})}else{for(;(l=d.nextSibling)&&l!=i;)l.remove();d.after(t.content)}}t.remove()}else n&&t.remove()}for(t of e[r]("svg *,math *"))t.tagName<"a"&&(t=t.closest("svg,math"))&&(t.innerHTML+="");n&&o.disconnect()},o=new MutationObserver(t);o.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",t)})(document);`;

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
