import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	let initPreactPatch = () => {
// 	  let isNotLoading = d.readyState[0] != "l", qsa = 'querySelectorAll',node;
//   	  // loop through all <template[for]> and move them
// 	  for ( node of d[qsa]("template[for]")) {
// 		// make sure the template is done streaming in
// 		if (isNotLoading || node.nextElementSibling) {
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
const INIT_SCRIPT = `(e=>{let t=()=>{let t,r="l"!=e.readyState[0],n="querySelectorAll";for(t of e[n]("template[for]"))if(r||t.nextElementSibling){let o,r,n,a,d=e.createNodeIterator(e,128),i="$s:"+t.getAttribute("for");for(;(n=d.nextNode())&&(!o||!r);)n.data==i?o=n:n.data=="/"+i&&(r=n);if(o&&r&&o.parentNode!==e){for(;(a=o.nextSibling)&&a!=r;)a.remove();o.after(t.content),t.remove()}}for(t of e[n]("svg *,math *"))t.tagName<"a"&&(t=t.closest("svg,math"))&&(t.innerHTML+="");r&&o.disconnect()},o=new MutationObserver(t);o.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",t)})(document);`;

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
