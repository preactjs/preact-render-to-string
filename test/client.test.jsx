import { describe, it, expect, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { h, render } from 'preact';
import { createInitScript, createSubtree } from '../src/lib/client';

/**
 * @param {string} [bodyHtml]
 */
function createDom(bodyHtml = '') {
	const dom = new JSDOM(
		`<!DOCTYPE html><html><body>${bodyHtml}</body></html>`,
		{
			runScripts: 'dangerously'
		}
	);
	return { dom, window: dom.window, document: dom.window.document };
}

/**
 * Extract and evaluate the inline init script in a given window.
 * @param {Window} window
 */
function runInitScript(window) {
	const html = createInitScript();
	expect(html.startsWith('<script>')).toBe(true);
	expect(html.endsWith('</script>')).toBe(true);
	const js = html.slice('<script>'.length, -'</script>'.length);
	window.eval(js);
}

/**
 * jsdom fires a real DOMContentLoaded shortly after construction; wait for it
 * so it can't disconnect the observer in tests that fake a loading document.
 * @param {Window} window
 */
function loaded(window) {
	return new Promise((resolve) => {
		if (window.document.readyState === 'complete') resolve();
		else window.addEventListener('load', () => resolve());
	});
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
function appendTemplate(document, id, html, closed = true) {
	const template = document.createElement('template');
	template.setAttribute('for', id);
	if (html) template.innerHTML = html;
	document.body.appendChild(template);
	// createSubtree always ends with "\n"; its presence tells the script the
	// parser has closed the template.
	if (closed) document.body.appendChild(document.createTextNode('\n'));
	return template;
}

/**
 * Body markup without the "\n" that trails every streamed template.
 * @param {Document} document
 */
function bodyHtml(document) {
	return document.body.innerHTML.replace(/\n/g, '');
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
			'<template for="5"><p>it works</p></template>\n'
		);
	});
});

describe('createInitScript', () => {
	it('should emit a self-executing script that sets up MutationObserver', () => {
		const html = createInitScript();
		expect(html).toContain('<script>');
		expect(html).toContain('MutationObserver');
		expect(html).toContain('DOMContentLoaded');
		expect(html).toContain('svg,math');
		expect(html).toContain('disconnect');
		expect(html).toContain('(e=>{');
		expect(html).toContain('})(document)');
		expect(html).not.toContain('HTMLTemplateElement');
		expect(html).toContain('</script>');
	});
});

describe('inline init script', () => {
	it('should replace fallback content between $s markers with template content', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading...<!--/$s:1--></div>'
		);

		runInitScript(window);
		document.body.insertAdjacentHTML(
			'beforeend',
			createSubtree('1', '<p>resolved</p>')
		);
		await flushMutations();

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>resolved</p><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should leave markers in place after patching', async () => {
		const { window, document } = createDom(
			'<div><!--$s:9-->fallback<!--/$s:9--></div>'
		);

		runInitScript(window);
		document.body.insertAdjacentHTML(
			'beforeend',
			createSubtree('9', '<span>ok</span>')
		);
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

		runInitScript(window);
		appendTogether(
			document,
			createSubtree('1', '<p>one</p>'),
			createSubtree('2', '<p>two</p>')
		);
		await flushMutations();

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>one</p><!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should continue processing later templates when an earlier one has no markers', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		// First template has no matching markers; second should still patch.
		// A mistaken `return` instead of `continue` would abort the batch here.
		appendTogether(
			document,
			createSubtree('missing', '<p>skip</p>'),
			createSubtree('1', '<p>resolved</p>')
		);
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
		expect(document.querySelector('template[for="missing"]')).not.toBeNull();
		expect(document.querySelector('template[for="1"]')).toBeNull();
	});

	it('should ignore templates that do not match any suspense markers', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		appendTogether(document, createSubtree('999', '<p>nope</p>'));
		await flushMutations();

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1-->loading<!--/$s:1--></div><template for="999"><p>nope</p></template>'
		);
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
		appendTogether(document, createSubtree('1', '<p>resolved</p>'));
		await flushMutations();

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>resolved</p><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should not patch a template that is still streaming while the document is loading', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		await loaded(window);
		setReadyState(document, 'loading');
		runInitScript(window);

		// Parser can expose <template for> before its children arrive; applying
		// now would insert empty content and remove the node so it never completes.
		appendTemplate(document, '1', '', false);
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1-->loading<!--/$s:1-->'
		);
		expect(document.querySelector('template[for="1"]')).not.toBeNull();

		// The following node arrives once the parser closes the template.
		document.querySelector('template[for="1"]').innerHTML = '<p>resolved</p>';
		document.body.appendChild(document.createTextNode('\n'));
		await flushMutations();

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>resolved</p><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should patch a closed template while loading without waiting for a later template', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		await loaded(window);
		setReadyState(document, 'loading');
		runInitScript(window);

		appendTemplate(document, '1', '<p>one</p>');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);
		expect(document.querySelector('template[for="1"]')).toBeNull();

		appendTemplate(document, '2', '<p>two</p>');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should patch a closed template with empty content while loading', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		await loaded(window);
		setReadyState(document, 'loading');
		runInitScript(window);

		appendTemplate(document, '1', '');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><!--/$s:1-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should not rescan the document for mutations unrelated to templates', async () => {
		const { window, document } = createDom('<div id="app"></div>');
		await loaded(window);
		runInitScript(window);

		let scans = 0;
		// a scan is the comment marker walk done when a template is patched
		const createNodeIterator = document.createNodeIterator.bind(document);
		document.createNodeIterator = (...args) => {
			scans++;
			return createNodeIterator(...args);
		};

		document
			.querySelector('#app')
			.append(document.createElement('p'), document.createComment('x'));
		await flushMutations();
		expect(scans).toBe(0);

		appendTogether(document, createSubtree('1', '<p>resolved</p>'));
		await flushMutations();
		expect(scans).toBeGreaterThan(0);
	});

	it('should disconnect the MutationObserver after a non-loading pass', async () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		runInitScript(window);
		appendTemplate(document, '1', '<p>one</p>');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);
		expect(document.querySelector('template[for="1"]')).toBeNull();

		// First complete-document pass disconnects the observer, so a later
		// template must stay in place instead of being applied.
		appendTemplate(document, '2', '<p>two</p>');
		await flushMutations();

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>one</p><!--/$s:1--><!--$s:2-->b<!--/$s:2-->'
		);
		expect(document.querySelector('template[for="2"]')).not.toBeNull();
	});

	it('should parse patched children in the svg/math namespace of their parent', async () => {
		const { window, document } = createDom(
			'<svg><!--$s:1--><!--/$s:1--></svg><math><!--$s:2--><!--/$s:2--></math>'
		);

		runInitScript(window);
		appendTogether(
			document,
			createSubtree('1', '<path></path>'),
			createSubtree('2', '<mi>x</mi>')
		);
		await flushMutations();

		expect(document.querySelector('path').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(document.querySelector('mi').namespaceURI).toBe(
			'http://www.w3.org/1998/Math/MathML'
		);
	});

	it('should fix the svg/math namespace after native DPU patched the range', async () => {
		const { window, document } = createDom(
			'<svg><!--$s:1--><circle></circle><!--/$s:1--></svg><math><!--$s:2--><mn>1</mn><!--/$s:2--></math>'
		);
		runInitScript(window);

		// Native DPU swaps the range between <?start>/<?end> and drops the template,
		// leaving HTML-namespace elements behind in the svg/math parent.
		for (const [id, tag] of [
			['1', 'rect'],
			['2', 'mi']
		]) {
			const end = [...document.querySelectorAll('svg, math')]
				.flatMap((el) => [...el.childNodes])
				.find((n) => n.data === '/$s:' + id);
			const pi = document.createProcessingInstruction('end', '');
			end.previousSibling.remove();
			end.before(document.createElement(tag), pi);
			pi.remove();
		}
		await flushMutations();

		expect(document.querySelector('rect').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(document.querySelector('mi').namespaceURI).toBe(
			'http://www.w3.org/1998/Math/MathML'
		);
	});

	it('should not reparse unrelated svg or math elements', async () => {
		const { window, document } = createDom(
			'<svg><circle></circle></svg><div><!--$s:1-->loading<!--/$s:1--></div>'
		);
		const circle = document.querySelector('circle');

		runInitScript(window);
		appendTogether(document, createSubtree('1', '<p>resolved</p>'));
		await flushMutations();

		expect(document.querySelector('circle')).toBe(circle);
	});
});

let hydrationDom;
const previousDocument = globalThis.document;
async function setupHydration(
	html = '<div id="root"><!--$s:1--><i>loading</i><!--/$s:1--></div>'
) {
	hydrationDom = new JSDOM(html, {
		runScripts: 'dangerously',
		url: 'http://localhost/'
	});
	const { window } = hydrationDom;
	globalThis.document = window.document;
	// jsdom fires a real DOMContentLoaded after construction, which would
	// disconnect the observer mid-test.
	await new Promise((resolve) => window.addEventListener('load', resolve));
	const script = createInitScript();
	window.eval(script.slice('<script>'.length, -'</script>'.length));
	return {
		document: window.document,
		root: window.document.querySelector('#root'),
		flush: () => new Promise((resolve) => setTimeout(resolve, 0))
	};
}

function appendStreamed(document, content = '<button>server</button>') {
	document.body.insertAdjacentHTML('beforeend', createSubtree('1', content));
}

function renderClient(root, children) {
	root.replaceChildren();
	render(children, root);
	// Keep the stream anchors, as resumed hydration does in Preact 11.
	root.prepend(document.createComment('$s:1'));
	root.append(document.createComment('/$s:1'));
}

describe('stream template hydration races', () => {
	afterEach(() => {
		hydrationDom.window.close();
		globalThis.document = previousDocument;
	});

	it('should replace a fallback that has no client-rendered nodes', async () => {
		const { document, root, flush } = await setupHydration();
		appendStreamed(document);
		await flush();
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>server</button><!--/$s:1-->'
		);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should preserve client nodes rendered before the template arrives', async () => {
		const { document, root, flush } = await setupHydration();
		let clicks = 0;
		renderClient(root, <button onClick={() => clicks++}>client</button>);
		const button = root.querySelector('button');
		const fallback = document.createElement('i');
		fallback.textContent = 'loading';
		root.insertBefore(fallback, root.lastChild);
		appendStreamed(document);
		await flush();
		expect(root.querySelector('button')).toBe(button);
		// Unowned fallback nodes are left for hydration to clean up.
		expect(root.textContent).toBe('clientloading');
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should preserve client text and multiple sibling elements', async () => {
		const { document, root, flush } = await setupHydration();
		renderClient(root, ['client text', <button>one</button>, <span>two</span>]);
		const nodes = Array.from(root.childNodes);
		appendStreamed(document, '<button>server</button><span>server</span>');
		await flush();
		expect(root.childNodes.length).toBe(nodes.length);
		nodes.forEach((node, i) => expect(root.childNodes[i]).toBe(node));
		expect(root.textContent).toBe('client textonetwo');
		expect(document.querySelector('template')).toBeNull();
	});

	it('should keep client nodes created after the template was queued', async () => {
		const { document, root, flush } = await setupHydration();
		// The template is already in the document when the client renders.
		appendStreamed(document);
		const start = root.firstChild;
		const end = root.lastChild;
		let clicks = 0;
		root.replaceChildren();
		render(<button onClick={() => clicks++}>client</button>, root);
		root.prepend(start);
		root.append(end);
		const button = root.querySelector('button');
		await flush();
		expect(root.querySelector('button')).toBe(button);
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should not throw when hydration removed the anchors', async () => {
		const { document, root, flush } = await setupHydration();
		root.replaceChildren();
		render(<button>client</button>, root);
		const button = root.firstChild;
		appendStreamed(document);
		await flush();
		expect(root.firstChild).toBe(button);
		expect(root.textContent).toBe('client');
	});

	it('should not mistake a hydrated sibling outside the boundary for resolved content', async () => {
		const { document, root, flush } = await setupHydration();
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
		appendStreamed(document);
		await flush();
		expect(section.textContent).toBe('server');
		expect(root.querySelector('button').textContent).toBe('outside');
	});

	it('should preserve input state even when the element has no DOM mutations', async () => {
		const { document, root, flush } = await setupHydration();
		renderClient(root, <input defaultValue="initial" />);
		const input = root.querySelector('input');
		input.value = 'edited';
		appendStreamed(document, '<input value="initial">');
		await flush();
		expect(root.querySelector('input')).toBe(input);
		expect(input.value).toBe('edited');
	});

	it('should retain nested suspended boundaries while discarding the outer patch', async () => {
		const { document, root, flush } = await setupHydration();
		renderClient(root, <button>client</button>);
		root
			.querySelector('button')
			.insertAdjacentHTML(
				'afterend',
				'<!--$s:2--><i>nested fallback</i><!--/$s:2-->'
			);
		appendStreamed(document);
		await flush();
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>client</button><!--$s:2--><i>nested fallback</i><!--/$s:2--><!--/$s:1-->'
		);
		expect(document.querySelector('template')).toBeNull();
	});
});
