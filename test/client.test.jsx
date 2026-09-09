import { expect, describe, it, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { h, render } from 'preact';
import { createInitScript, createSubtree } from '../src/lib/client.js';

/**
 * @param {string} [bodyHtml]
 */
function createDom(bodyHtml = '') {
	const dom = new JSDOM(
		`<!DOCTYPE html><html><body>${bodyHtml}</body></html>`,
		{
			runScripts: 'dangerously',
			url: 'http://localhost/'
		}
	);
	return { dom, window: dom.window, document: dom.window.document };
}

/**
 * Script body from a `<script>` / `<script nonce="...">` tag.
 * @param {string} html
 */
function getScriptText(html) {
	const match = /<script[^>]*>([\s\S]*)<\/script>/.exec(html);
	expect(match).not.toBeNull();
	return match[1];
}

/**
 * Run the inline init script in a given window, the way a classic script tag would.
 * @param {Window} window
 */
function runInitScript(window) {
	window.eval(getScriptText(createInitScript()));
}

/**
 * Flush MutationObserver callbacks scheduled by jsdom.
 */
function flushMutations() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * @param {Document} document
 * @param {'loading' | 'interactive' | 'complete'} state
 */
function setReadyState(document, state) {
	Object.defineProperty(document, 'readyState', {
		configurable: true,
		get: () => state
	});
}

/**
 * @param {Document} document
 * @param {string} id
 * @param {string} html
 */
function appendTemplate(document, id, html) {
	const template = document.createElement('template');
	template.setAttribute('for', id);
	if (html) template.innerHTML = html;
	document.body.appendChild(template);
	return template;
}

/**
 * Signal that a streamed <template for> is complete by appending its $p: comment.
 * @param {HTMLTemplateElement} template
 * @param {string} id
 */
function appendPatchComment(template, id) {
	template.after(template.ownerDocument.createComment('$p:' + id));
}

/**
 * Append several HTML snippets as siblings in a single mutation.
 * @param {Document} document
 * @param {...string} htmlSnippets
 */
function appendTogether(document, ...htmlSnippets) {
	const wrap = document.createElement('div');
	wrap.innerHTML = htmlSnippets.join('');
	const frag = document.createDocumentFragment();
	while (wrap.firstChild) frag.appendChild(wrap.firstChild);
	document.body.appendChild(frag);
}

describe('createSubtree', () => {
	it('should wrap content in a template with a for attribute', () => {
		expect(createSubtree('5', '<p>it works</p>')).toBe(
			'<template for="5"><p>it works</p></template><!--$p:5-->'
		);
	});
});

describe('createInitScript', () => {
	it('should emit a script that sets up MutationObserver', () => {
		const html = createInitScript();
		expect(html.startsWith('<script>')).toBe(true);
		expect(html.endsWith('</script>')).toBe(true);

		const body = getScriptText(html);
		expect(body).toContain('MutationObserver');
		expect(body).toContain('$p:');
		expect(body).toContain('$s:');
		expect(body).toContain('disconnect');
		expect(body).toContain('parentElement');
		expect(body).toContain('closest("svg,math")');
		expect(body).toContain('.content');
		expect(() => new Function(body)).not.toThrow();
	});
});

describe('inline init script', () => {
	it('should replace fallback content when a $p: subtree arrives', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading...<!--/$s:1--></div>'
		);

		runInitScript(window);
		appendTogether(document, createSubtree('1', '<p>resolved</p>'));
		await flushMutations();

		expect(document.body.innerHTML).toBe(
			'<div><!--$s:1--><p>resolved</p><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should strip processing-instruction fallback wrappers used by streaming', async () => {
		const { window, document } = createDom(
			'<div><!--$s:5--><?start name="5">loading...<?end><!--/$s:5--></div>'
		);

		runInitScript(window);
		appendTogether(document, createSubtree('5', '<p>it works</p>'));
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:5--><p>it works</p><!--/$s:5-->'
		);
		expect(document.body.querySelectorAll('template')).toHaveLength(0);
	});

	it('should replace fallback content when a $p: completion comment arrives', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading...<!--/$s:1--></div>'
		);

		runInitScript(window);
		const template = appendTemplate(document, '1', '<p>resolved</p>');
		appendPatchComment(template, '1');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should leave $s markers in place and remove the $p: comment after patching', async () => {
		const { window, document } = createDom(
			'<div><!--$s:9-->fallback<!--/$s:9--></div>'
		);

		runInitScript(window);
		const template = appendTemplate(document, '9', '<span>ok</span>');
		appendPatchComment(template, '9');
		await flushMutations();

		const comments = [];
		const iter = document.createNodeIterator(
			document.body,
			window.NodeFilter.SHOW_COMMENT
		);
		let node;
		while ((node = iter.nextNode())) comments.push(node.data);

		expect(comments).toEqual(['$s:9', '/$s:9']);
		expect(document.querySelector('span').textContent).toBe('ok');
	});

	it('should patch multiple suspense boundaries independently', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		setReadyState(document, 'loading');
		runInitScript(window);
		const first = appendTemplate(document, '1', '<p>one</p>');
		const second = appendTemplate(document, '2', '<p>two</p>');
		appendPatchComment(first, '1');
		await flushMutations();
		appendPatchComment(second, '2');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should continue processing later templates when an earlier one has no markers', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		// First template has no matching markers; second should still patch.
		// A mistaken `return` instead of continuing the addedNodes loop would
		// abort the batch here. Unmatched stamps are consumed.
		const skip = appendTemplate(document, 'missing', '<p>skip</p>');
		const next = appendTemplate(document, '1', '<p>resolved</p>');
		appendPatchComment(skip, 'missing');
		appendPatchComment(next, '1');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
		expect(document.querySelector('template[for="missing"]')).toBeNull();
		expect(document.querySelector('template[for="1"]')).toBeNull();
	});

	it('should ignore templates that do not match any suspense markers', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		appendTogether(document, createSubtree('999', '<p>nope</p>'));
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1-->loading<!--/$s:1-->'
		);
		expect(document.querySelector('template[for="999"]')).toBeNull();
	});

	it('should still patch templates when htmlFor is present on HTMLTemplateElement', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		Object.defineProperty(window.HTMLTemplateElement.prototype, 'htmlFor', {
			configurable: true,
			enumerable: true,
			get() {
				return this.getAttribute('for');
			},
			set(v) {
				this.setAttribute('for', v);
			}
		});

		runInitScript(window);
		const template = appendTemplate(document, '1', '<p>resolved</p>');
		appendPatchComment(template, '1');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should not patch a template that is still streaming while the document is loading', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		setReadyState(document, 'loading');
		runInitScript(window);

		const template = appendTemplate(document, '1', '');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1-->loading<!--/$s:1-->'
		);
		expect(document.querySelector('template[for="1"]')).not.toBeNull();

		template.innerHTML = '<p>resolved</p>';
		appendPatchComment(template, '1');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should patch a streamed template once its completion comment arrives', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		setReadyState(document, 'loading');
		runInitScript(window);

		const first = appendTemplate(document, '1', '<p>one</p>');
		await flushMutations();

		expect(document.querySelector('template[for="1"]')).not.toBeNull();
		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);

		appendPatchComment(first, '1');
		const second = appendTemplate(document, '2', '<p>two</p>');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);
		expect(document.querySelector('template[for="1"]')).toBeNull();
		expect(document.querySelector('template[for="2"]')).not.toBeNull();

		appendPatchComment(second, '2');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should not patch an incomplete template just because another template completes', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		setReadyState(document, 'loading');
		runInitScript(window);

		const partial = appendTemplate(document, '1', '');
		const complete = appendTemplate(document, '2', '<p>two</p>');
		appendPatchComment(complete, '2');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1-->loading<!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2-->'
		);
		expect(document.querySelector('template[for="1"]')).not.toBeNull();
		expect(document.querySelector('template[for="2"]')).toBeNull();

		partial.innerHTML = '<p>one</p>';
		appendPatchComment(partial, '1');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2-->'
		);
		expect(document.querySelector('template[for="1"]')).toBeNull();
	});

	it('should not patch $p: comments already in the document on DOMContentLoaded', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>' +
				createSubtree('1', '<p>resolved</p>')
		);

		setReadyState(document, 'loading');
		runInitScript(window);

		expect(document.querySelector('template[for="1"]')).not.toBeNull();

		setReadyState(document, 'interactive');
		document.dispatchEvent(new window.Event('DOMContentLoaded'));

		expect(document.body.innerHTML).toBe(
			'<div><!--$s:1-->loading<!--/$s:1--></div><template for="1"><p>resolved</p></template><!--$p:1-->'
		);
		expect(document.querySelector('template[for="1"]')).not.toBeNull();
	});

	it('should disconnect the MutationObserver after a non-loading pass', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		runInitScript(window);
		const first = appendTemplate(document, '1', '<p>one</p>');
		appendPatchComment(first, '1');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);
		expect(document.querySelector('template[for="1"]')).toBeNull();

		const second = appendTemplate(document, '2', '<p>two</p>');
		appendPatchComment(second, '2');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);
		expect(document.querySelector('template[for="2"]')).not.toBeNull();
	});

	it('should not reparse sibling svg and math hosts from an HTML hole', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.appendChild(document.createElement('path'));
		const math = document.createElementNS(
			'http://www.w3.org/1998/Math/MathML',
			'math'
		);
		math.appendChild(document.createElement('mi'));
		document.body.append(svg, math);

		expect(svg.firstChild.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(math.firstChild.namespaceURI).toBe('http://www.w3.org/1999/xhtml');

		runInitScript(window);
		const template = appendTemplate(document, '1', '<p>resolved</p>');
		appendPatchComment(template, '1');
		await flushMutations();

		expect(svg.firstChild.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(math.firstChild.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
	});

	it('should reparse an svg host when the hole is a direct child of it', async () => {
		const { window, document } = createDom();
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.appendChild(document.createComment('$s:1'));
		svg.appendChild(document.createElement('path'));
		svg.appendChild(document.createComment('/$s:1'));
		document.body.append(svg);

		expect(svg.childNodes[1].namespaceURI).toBe('http://www.w3.org/1999/xhtml');

		runInitScript(window);
		const template = appendTemplate(document, '1', '<circle></circle>');
		appendPatchComment(template, '1');
		await flushMutations();

		expect(svg.querySelector('circle')).not.toBeNull();
		expect(svg.querySelector('circle').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(svg.querySelector('path')).toBeNull();
	});

	it('should reparse an svg host when the hole is nested in an svg child', async () => {
		const { window, document } = createDom();
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		group.appendChild(document.createComment('$s:1'));
		group.appendChild(document.createElement('path'));
		group.appendChild(document.createComment('/$s:1'));
		svg.appendChild(group);
		document.body.append(svg);

		runInitScript(window);
		const template = appendTemplate(document, '1', '<circle></circle>');
		appendPatchComment(template, '1');
		await flushMutations();

		expect(svg.querySelector('circle')).not.toBeNull();
		expect(svg.querySelector('circle').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(svg.querySelector('path')).toBeNull();
	});

	it('should reparse a math host when the hole is a direct child of it', async () => {
		const { window, document } = createDom();
		const math = document.createElementNS(
			'http://www.w3.org/1998/Math/MathML',
			'math'
		);
		math.appendChild(document.createComment('$s:1'));
		math.appendChild(document.createElement('mi'));
		math.appendChild(document.createComment('/$s:1'));
		document.body.append(math);

		expect(math.childNodes[1].namespaceURI).toBe(
			'http://www.w3.org/1999/xhtml'
		);

		runInitScript(window);
		const template = appendTemplate(document, '1', '<mn>1</mn>');
		appendPatchComment(template, '1');
		await flushMutations();

		expect(math.querySelector('mn')).not.toBeNull();
		expect(math.querySelector('mn').namespaceURI).toBe(
			'http://www.w3.org/1998/Math/MathML'
		);
		expect(math.querySelector('mi')).toBeNull();
	});

	it('should still reparse svg when native DPU already applied the template', async () => {
		const { window, document } = createDom();
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.appendChild(document.createComment('$s:1'));
		// Simulate native DPU: HTML-namespace content already between markers, template gone.
		svg.appendChild(document.createElement('circle'));
		svg.appendChild(document.createComment('/$s:1'));
		document.body.append(svg);

		expect(svg.querySelector('circle').namespaceURI).toBe(
			'http://www.w3.org/1999/xhtml'
		);

		runInitScript(window);
		// Native DPU leaves whitespace before $p:, so previousSibling is a Text node.
		document.body.appendChild(document.createTextNode('\n'));
		document.body.appendChild(document.createComment('$p:1'));
		await flushMutations();

		expect(svg.querySelector('circle')).not.toBeNull();
		expect(svg.querySelector('circle').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
	});
});

describe('stream island races', () => {
	let dom;
	const previousDocument = globalThis.document;
	afterEach(() => {
		dom.window.close();
		globalThis.document = previousDocument;
	});

	function setup(
		html = '<div id="root"><!--$s:1--><i>loading</i><!--/$s:1--></div>'
	) {
		const created = createDom(html);
		dom = created.dom;
		globalThis.document = created.document;
		runInitScript(created.window);
		return {
			document: created.document,
			root: created.document.querySelector('#root')
		};
	}

	function appendPatch(document, content = '<button>server</button>') {
		document.body.insertAdjacentHTML('beforeend', createSubtree('1', content));
	}

	function renderClient(root, children) {
		root.replaceChildren();
		render(children, root);
		// Keep the stream anchors, as resumed hydration does in Preact 11.
		root.prepend(document.createComment('$s:1'));
		root.append(document.createComment('/$s:1'));
	}

	it('should replace a fallback that has no client-rendered nodes', async () => {
		const { document, root } = setup();
		appendPatch(document);
		await flushMutations();
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>server</button><!--/$s:1-->'
		);
		expect(document.querySelector('template[for]')).toBeNull();
	});

	it('should preserve client nodes rendered before the patch is applied', async () => {
		const { document, root } = setup();
		let clicks = 0;
		renderClient(root, <button onClick={() => clicks++}>client</button>);
		const button = root.querySelector('button');
		const fallback = document.createElement('i');
		fallback.textContent = 'loading';
		root.insertBefore(fallback, root.lastChild);
		appendPatch(document);
		await flushMutations();
		expect(root.querySelector('button')).toBe(button);
		expect(root.textContent).toBe('client');
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('template[for]')).toBeNull();
	});

	it('should recheck client ownership after the patch is queued', async () => {
		const { document, root } = setup();
		appendPatch(document);
		// Preserve the same anchors, but let the client create content between them
		// before the observer runs.
		const start = root.firstChild;
		const end = root.lastChild;
		let clicks = 0;
		root.replaceChildren();
		render(<button onClick={() => clicks++}>client</button>, root);
		root.prepend(start);
		root.append(end);
		const button = root.querySelector('button');
		await flushMutations();
		expect(root.querySelector('button')).toBe(button);
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('template[for]')).toBeNull();
	});

	it('should discard a patch when hydration removed the anchors before it runs', async () => {
		const { document, root } = setup();
		appendPatch(document);
		root.replaceChildren();
		render(<button>client</button>, root);
		const button = root.firstChild;
		await expect(flushMutations()).resolves.toBeUndefined();
		expect(root.firstChild).toBe(button);
		expect(root.textContent).toBe('client');
		expect(document.querySelector('template[for]')).toBeNull();
	});

	it('should discard a patch when its boundary has already disappeared', async () => {
		const { document, root } = setup();
		root.replaceChildren();
		render(<button>client</button>, root);
		appendPatch(document);
		await flushMutations();
		expect(root.textContent).toBe('client');
		expect(document.querySelector('template[for]')).toBeNull();
	});

	it('should preserve client text and multiple sibling elements', async () => {
		const { document, root } = setup();
		renderClient(root, ['client text', <button>one</button>, <span>two</span>]);
		const nodes = Array.from(root.childNodes);
		appendPatch(document, '<button>server</button><span>server</span>');
		await flushMutations();
		expect(root.childNodes.length).toBe(nodes.length);
		nodes.forEach((node, i) => expect(root.childNodes[i]).toBe(node));
		expect(root.textContent).toBe('client textonetwo');
	});

	it('should not mistake a hydrated sibling outside the boundary for resolved content', async () => {
		const { document, root } = setup();
		root.replaceChildren();
		render(
			<main>
				<button>outside</button>
				<section />
			</main>,
			root
		);
		const section = root.querySelector('section');
		section.innerHTML = '<!--$s:1--><i>loading</i><!--/$s:1-->';
		appendPatch(document);
		await flushMutations();
		expect(section.textContent).toBe('server');
		expect(root.querySelector('button').textContent).toBe('outside');
	});

	it('should preserve input state even when the element has no DOM mutations', async () => {
		const { document, root } = setup();
		renderClient(root, <input defaultValue="initial" />);
		const input = root.querySelector('input');
		input.value = 'edited';
		appendPatch(document, '<input value="initial">');
		await flushMutations();
		expect(root.querySelector('input')).toBe(input);
		expect(input.value).toBe('edited');
	});

	it('should retain nested suspended boundaries while discarding the outer patch', async () => {
		const { document, root } = setup();
		renderClient(root, <button>client</button>);
		root
			.querySelector('button')
			.insertAdjacentHTML(
				'afterend',
				'<!--$s:2--><i>nested fallback</i><!--/$s:2-->'
			);
		appendPatch(document);
		await flushMutations();
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>client</button><!--$s:2--><i>nested fallback</i><!--/$s:2--><!--/$s:1-->'
		);
	});
});
