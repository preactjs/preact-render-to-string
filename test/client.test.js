import { expect, describe, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { createInitScript, createSubtree } from '../src/lib/client.js';

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
 * Flush MutationObserver callbacks scheduled by jsdom.
 */
function flushMutations() {
	return new Promise((resolve) => setTimeout(resolve, 0));
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
			'<template for="5"><p>it works</p></template>'
		);
	});
});

describe('createInitScript', () => {
	it('should emit a self-executing script that sets up MutationObserver', () => {
		const html = createInitScript();
		expect(html).toContain('<script>');
		expect(html).toContain('MutationObserver');
		expect(html).toContain('HTMLTemplateElement');
		expect(html).toContain('(function(){');
		expect(html).toContain('}())');
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

		expect(document.body.innerHTML).toBe(
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

		expect(document.body.innerHTML).toBe(
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

		expect(document.body.innerHTML).toBe(
			'<div><!--$s:1-->loading<!--/$s:1--></div><template for="999"><p>nope</p></template>'
		);
	});

	it('should not install a MutationObserver when htmlFor is natively supported', async () => {
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

		// Native DPU path: polyfill must no-op and leave the template in place.
		expect(document.body.innerHTML).toBe(
			'<div><!--$s:1-->loading<!--/$s:1--></div><template for="1"><p>resolved</p></template>'
		);
	});
});
