/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// function initPreactIslandElement() {
// 	let template = document.createElement("template");
// 	template.innerHTML = '<?start name="x">';
// 	if (template.content.firstChild && template.content.firstChild.nodeType == 7) {
// 		return;
// 	}

// 	function findDirectives(id) {
// 		var s,
// 			e,
// 			c = document.createNodeIterator(document, 128);
// 		while (c.nextNode()) {
// 			let n = c.referenceNode;

// 			if (n.data == '?start name="' + id + '"') s = n;
// 			else if (n.data == '?end name="' + id + '"') e = n;
// 			if (s && e) return [s, e];
// 		}
// 	}

// 	let observer = new MutationObserver((mutations) => {
// 		for (let mutation of mutations) {
// 			for (let node of mutation.addedNodes) {
// 				if (node.nodeName === "TEMPLATE") {
// 					let id = node.getAttribute("for");
// 					if (id) {
// 						let pair = findDirectives(id);
// 						if (pair) {
// 							requestAnimationFrame(() => {
// 								pair = findDirectives(node.getAttribute("for"));
// 								if (!pair) {
// 									node.remove();
// 									return;
// 								}
// 								let [s, e] = pair;
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
// 								e.remove();
// 								node.remove();
// 							});
// 						} else {
// 							node.remove();
// 						}
// 					}
// 				}
// 			}
// 		}
// 	});
// 	observer.observe(document.body, { childList: true, subtree: true });
// }

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `let t=document.createElement("template");if(t.innerHTML='<?start name="x">',t.content.firstChild&&7==t.content.firstChild.nodeType)return;let e=new MutationObserver(e=>{let t=e=>{for(var o,r,n=document.createNodeIterator(document,128);n.nextNode();){let l=n.referenceNode;if(l.data=='?start name="'+e+'"'?o=l:l.data=='?end name="'+e+'"'&&(r=l),o&&r)return[o,r]}};for(let o of e)for(let e of o.addedNodes)if("TEMPLATE"===e.nodeName){let o=e.getAttribute("for");if(o){let r=t(o);r?requestAnimationFrame(()=>{let o=t(e.getAttribute("for"));if(!o)return void e.remove();let[r,n]=o,l=n.previousSibling;for(;l!=r&&l&&l!=r;)n.parentNode.removeChild(l),l=n.previousSibling;let d=document.createElement("template");r.replaceWith(d),d.insertAdjacentHTML("beforebegin",e.innerHTML),d.remove(),n.remove(),e.remove()}):e.remove()}}});e.observe(document.body,{childList:!0,subtree:!0});`;

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
