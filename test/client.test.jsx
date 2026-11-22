import { describe, it, expect, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
	createInitScript,
	createSubtree,
	createClientRenderInstruction
} from '../src/lib/client';

const SVG = 'http://www.w3.org/2000/svg';
const MATHML = 'http://www.w3.org/1998/Math/MathML';

/**
 * A pending range as the renderer writes it. A parser without processing
 * instructions in HTML turns `<?start>` and `<?end>` into comments.
 * @param {string} id
 * @param {string} fallback
 */
function range(id, fallback = 'loading...') {
	return `<!--$s?${id}--><?start name="${id}">${fallback}<?end><!--/$s?${id}-->`;
}

/**
 * The same markup as the HTML parser leaves it.
 * @param {string} html
 */
function parsed(html) {
	return html.replace(/<\?([^>]*)>/g, '<!--?$1-->');
}

const doms = [];
afterEach(() => {
	doms.splice(0).forEach((dom) => dom.window.close());
});

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
	doms.push(dom);
	const { window } = dom;
	const html = createInitScript();
	window.eval(html.slice('<script>'.length, -'</script>'.length));
	return { window, document: window.document };
}

/**
 * The comment with this data, searched through the whole document.
 * @param {Document} document
 * @param {string} data
 */
function findComment(document, data) {
	const walker = document.createTreeWalker(document, 128);
	let node;
	while ((node = walker.nextNode())) if (node.data === data) return node;
	return null;
}

/**
 * Run the script of a chunk, like the browser does while it parses it.
 * @param {Window} window
 * @param {string} id
 * @param {{ x?: boolean }} [opts]
 */
function runScript(window, id, { x } = {}) {
	const script = window.document.createElement('script');
	script.dataset.p = id;
	if (x) script.dataset.x = '';
	script.textContent = '$PRS()';
	window.document.body.appendChild(script);
}

/**
 * Add a chunk's template without its script, as the parser would, then run it.
 * @param {Window} window
 * @param {string} id
 * @param {string} content
 */
function streamChunk(window, id, content) {
	window.document.body.insertAdjacentHTML(
		'beforeend',
		createSubtree(id, content).replace(/<script.*$/, '')
	);
	runScript(window, id);
}

describe('createSubtree', () => {
	it('should wrap content in a template with a for attribute followed by a $PRS call', () => {
		expect(createSubtree('5', '<p>it works</p>')).toBe(
			'<template for="5"><p>it works</p></template><script data-p="5">$PRS()</script>'
		);
	});

	it('should put the nonce on the $PRS script', () => {
		expect(createSubtree('5', '', 'abc"')).toBe(
			'<template for="5"></template><script data-p="5" nonce="abc&quot;">$PRS()</script>'
		);
	});
});

describe('createClientRenderInstruction', () => {
	it('should be a $PRS script with data-x and no template', () => {
		expect(createClientRenderInstruction('a')).toBe(
			'<script data-p="a" data-x>$PRS()</script>'
		);
	});

	it('should put the nonce on the script', () => {
		expect(createClientRenderInstruction('a', 'abc"')).toBe(
			'<script data-p="a" data-x nonce="abc&quot;">$PRS()</script>'
		);
	});
});

describe('createInitScript', () => {
	it('should emit a self-executing script that defines $PRS', () => {
		const html = createInitScript();
		expect(html.startsWith('<script>')).toBe(true);
		expect(html).toContain('window.$PRS=');
		expect(html).toContain('DOMContentLoaded');
		expect(html).toContain('svg,math');
		expect(html).toContain('})(document)');
		expect(html).not.toContain('MutationObserver');
		expect(html.endsWith('</script>')).toBe(true);
	});
});

describe('inline init script', () => {
	it('should replace the fallback between the markers with the template content', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);

		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div>'
		);
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should only rename and wake when the browser consumed the template', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		let woken = 0;
		start.__w = () => woken++;

		// the browser patched the range natively: no template is left
		const end = findComment(document, '/$s?1');
		while (start.nextSibling != end) start.nextSibling.remove();
		end.before(document.createElement('p'));
		runScript(window, '1');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p></p><!--/$s?1--></div>'
		);
		expect(woken).toBe(1);
		expect(document.querySelectorAll('script')).toHaveLength(0);
	});

	it('should patch independent boundaries one by one', () => {
		const { window, document } = createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);

		streamChunk(window, '2', '<p>two</p>');
		expect(findComment(document, '$s=')).toBe(
			findComment(document, '/$s?2').previousSibling.previousSibling
		);
		expect(findComment(document, '$s?1')).not.toBeNull();

		streamChunk(window, '1', '<p>one</p>');
		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>one</p><!--/$s?1--><!--$s=--><p>two</p><!--/$s?2--></div>'
		);
	});

	it('should patch a nested boundary that came with the outer chunk in a later call', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);

		streamChunk(window, '1', `<section>${range('2', 'inner')}</section>`);
		expect(findComment(document, '$s?2')).not.toBeNull();

		streamChunk(window, '2', '<p>inner</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><section><!--$s=--><p>inner</p><!--/$s?2--></section><!--/$s?1--></div>'
		);
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should call __w of the opening marker once the range is patched', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		const calls = [];
		findComment(document, '$s?1').__w = function () {
			calls.push([this.data, this.nextSibling.textContent]);
		};

		streamChunk(window, '1', 'done');

		expect(calls).toEqual([['$s=', 'done']]);
	});

	it('should not touch a range that is already patched', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		streamChunk(window, '1', 'first');
		const start = findComment(document, '$s=');
		let woken = 0;
		start.__w = () => woken++;

		streamChunk(window, '1', 'second');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=-->first<!--/$s?1--></div>'
		);
		expect(woken).toBe(0);
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should patch a chunk with empty content', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);

		streamChunk(window, '1', '');

		expect(document.body.innerHTML).toBe('<div><!--$s=--><!--/$s?1--></div>');
	});

	it('should patch a range that is in a detached subtree', () => {
		const { window, document } = createDom(
			`<div id="a">${range('1')}</div><div id="b"></div>`
		);
		// the first call indexes the markers that are in the document
		runScript(window, 'none');
		const detached = document.querySelector('#a');
		detached.remove();

		streamChunk(window, '1', '<p>resolved</p>');

		expect(detached.innerHTML).toBe('<!--$s=--><p>resolved</p><!--/$s?1-->');
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should hand the range to the client with data-x and keep the fallback', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		let woken = 0;
		start.__w = () => woken++;

		runScript(window, '1', { x: true });

		expect(document.body.innerHTML).toBe(
			`<div>${parsed(range('1')).replace('$s?1', '$s!')}</div>`
		);
		expect(start.data).toBe('$s!');
		expect(woken).toBe(1);
		expect(document.querySelectorAll('script')).toHaveLength(0);
	});

	it('should hand the range to the client when its template was lost', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		let woken = 0;
		start.__w = () => woken++;

		// No template, and the range still opens with <?start>: nothing patched
		// it. Hydrating a whole document removes a half-parsed template.
		runScript(window, '1');

		expect(document.body.innerHTML).toBe(
			`<div>${parsed(range('1')).replace('$s?1', '$s!')}</div>`
		);
		expect(woken).toBe(1);
		expect(document.querySelectorAll('script')).toHaveLength(0);
	});

	it('should hand the range to the client when its template was lost and <?start> is a processing instruction', () => {
		const { window, document } = createDom(
			'<div><!--$s?1--><!--/$s?1--></div>'
		);
		const start = findComment(document, '$s?1');
		start.after(document.createProcessingInstruction('start', 'name="1"'));

		runScript(window, '1');

		expect(start.data).toBe('$s!');
	});

	it('should drop the range when the client unmounted it while pending', () => {
		const { window, document } = createDom(
			`<div>${range('1')}<i>after</i></div>`
		);
		findComment(document, '$s?1').__w = 0;

		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe('<div><i>after</i></div>');
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should drop the range with data-x too when it was unmounted', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		findComment(document, '$s?1').__w = 0;

		runScript(window, '1', { x: true });

		expect(document.body.innerHTML).toBe('<div></div>');
	});

	it('should remove unmounted ranges on DOMContentLoaded', () => {
		const { window, document } = createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);
		findComment(document, '$s?1').__w = 0;
		const waiting = findComment(document, '$s?2');
		waiting.__w = () => {};

		document.dispatchEvent(new window.Event('DOMContentLoaded'));

		expect(document.body.innerHTML).toContain(
			parsed(range('2', 'b')).slice(10)
		);
		expect(findComment(document, '$s?1')).toBe(null);
	});

	it('should hand a range that is still waiting to the client on DOMContentLoaded', () => {
		const { window, document } = createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);
		const waiting = findComment(document, '$s?1');
		let woken = 0;
		waiting.__w = () => woken++;

		document.dispatchEvent(new window.Event('DOMContentLoaded'));

		expect(waiting.data).toBe('$s!');
		expect(woken).toBe(1);
		// no boundary waits on this one
		expect(findComment(document, '$s?2')).not.toBe(null);
	});

	it('should not remove a range on DOMContentLoaded that the client has not unmounted', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		const before = document.body.innerHTML;

		document.dispatchEvent(new window.Event('DOMContentLoaded'));

		expect(document.body.innerHTML).toBe(before);
	});

	it('should remove the template and the script when the markers are missing', () => {
		const { window, document } = createDom('<div><i>client</i></div>');
		const errors = [];
		window.addEventListener('error', (e) => errors.push(e.error));

		streamChunk(window, '1', '<p>resolved</p>');

		expect(errors).toEqual([]);
		expect(document.body.innerHTML).toBe('<div><i>client</i></div>');
	});

	it('should leave the range alone when only its closing marker is left', () => {
		const { window, document } = createDom(
			'<div><i>client</i><!--/$s?1--></div>'
		);

		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><i>client</i><!--/$s?1--></div>'
		);
	});

	it('should leave the range alone when the markers have different parents', () => {
		const { window, document } = createDom(
			'<div><!--$s?1-->a</div><div>b<!--/$s?1--></div>'
		);

		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s?1-->a</div><div>b<!--/$s?1--></div>'
		);
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	// FAILS: the sibling walk runs past the last sibling and throws on null
	it('should not throw when the closing marker precedes the opening marker', () => {
		const { window, document } = createDom(
			`<div><!--/$s?1-->${range('1')}</div>`
		);

		expect(() => streamChunk(window, '1', '<p>content</p>')).not.toThrow();
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should remove a processing instruction and a comment form of start/end alike', () => {
		const { window, document } = createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		// an XML-aware parser would build processing instructions
		const pi = document.createProcessingInstruction('start', 'name="1"');
		start.after(pi);

		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div>'
		);
		expect(pi.isConnected).toBe(false);
	});

	it('should parse the patched children in the svg and math namespace of their parent', () => {
		const { window, document } = createDom(
			`<svg>${range('1', '')}</svg><math>${range('2', '')}</math>`
		);

		streamChunk(window, '1', '<path></path>');
		streamChunk(window, '2', '<mi>x</mi>');

		expect(document.querySelector('path').namespaceURI).toBe(SVG);
		expect(document.querySelector('mi').namespaceURI).toBe(MATHML);
	});

	it('should fix the namespace after the browser patched the range natively', () => {
		const { window, document } = createDom(
			`<svg>${range('1', '<g></g>')}</svg>`
		);
		const start = findComment(document, '$s?1');
		const end = findComment(document, '/$s?1');
		while (start.nextSibling != end) start.nextSibling.remove();
		// native patching leaves html namespace elements behind in the svg
		end.before(document.createElement('rect'));
		expect(document.querySelector('rect').namespaceURI).not.toBe(SVG);

		runScript(window, '1');

		expect(document.querySelector('rect').namespaceURI).toBe(SVG);
		expect(start.data).toBe('$s=');
	});

	it('should patch a nested boundary in an svg after the outer one was reparsed', () => {
		const { window, document } = createDom(`<svg>${range('1', '')}</svg>`);

		streamChunk(window, '1', `<g>${range('2', '')}</g>`);
		streamChunk(window, '2', '<path></path>');

		const path = document.querySelector('path');
		expect(path.namespaceURI).toBe(SVG);
		expect(path.parentNode.localName).toBe('g');
		expect(findComment(document, '$s?2')).toBeNull();
	});

	it('should leave HTML inside foreignObject in the HTML namespace', () => {
		const { window, document } = createDom(`<svg>${range('1', '')}</svg>`);

		streamChunk(
			window,
			'1',
			'<foreignObject><div id="h">t</div></foreignObject>'
		);

		const inner = document.getElementById('h');
		expect(inner.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(inner.textContent).toBe('t');
	});

	it('should not reparse unrelated svg elements', () => {
		const { window, document } = createDom(
			`<svg><circle></circle></svg><div>${range('1')}</div>`
		);
		const circle = document.querySelector('circle');

		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.querySelector('circle')).toBe(circle);
	});
});
