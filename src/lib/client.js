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
// 		  if (s && e && s.parentNode !== d) {
// 			while ((p = s.nextSibling) && p != e) p.remove();
// 			s.after(node.content);
// 			node.remove();
// 		  }
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
const INIT_SCRIPT = `(e=>{let t=()=>{let t,n="l"!=e.readyState[0],r="querySelectorAll";for(t of e[r]("template[for]"))if(n||t.nextElementSibling&&t.content.childNodes.length){let o,n,r,a,d=e.createNodeIterator(e,128),l="$s:"+t.getAttribute("for");for(;(r=d.nextNode())&&(!o||!n);)r.data==l?o=r:r.data=="/"+l&&(n=r);if(o&&n&&o.parentNode!==e){for(;(a=o.nextSibling)&&a!=n;)a.remove();o.after(t.content),t.remove()}}for(t of e[r]("svg *,math *"))t.tagName<"a"&&(t=t.closest("svg,math"))&&(t.innerHTML+="");n&&o.disconnect()},o=new MutationObserver(t);o.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",t)})(document);`;

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
