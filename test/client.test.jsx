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
 * A pending range as the renderer writes it.
 * @param {string} id
 * @param {string} fallback
 */
function range(id, fallback = 'loading...') {
	return `<!--$s?${id}-->${fallback}<!--/$s?${id}-->`;
}

const doms = [];
afterEach(() => {
	doms.splice(0).forEach((dom) => dom.window.close());
});

/**
 * @param {string} [bodyHtml]
 */
async function createDom(bodyHtml = '') {
	const dom = new JSDOM(
		`<!DOCTYPE html><html><body>${bodyHtml}</body></html>`,
		{
			runScripts: 'dangerously'
		}
	);
	doms.push(dom);
	const { window } = dom;
	// jsdom fires DOMContentLoaded after the first tick: it would patch the
	// islands of a test that is already running
	if (window.document.readyState !== 'complete') {
		await new Promise((resolve) => window.addEventListener('load', resolve));
	}
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

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Connect an island as the last node of the body. Nothing follows it yet, so it
 * must not patch.
 * @param {Window} window
 * @param {string} html
 */
async function appendIsland(window, html) {
	// appendChild, not insertAdjacentHTML: jsdom reports the nodes of a parsed
	// fragment to an observer that the island registers while it connects
	const template = window.document.createElement('template');
	template.innerHTML = html;
	window.document.body.appendChild(template.content.firstChild);
	await tick();
}

/**
 * Add the node that follows an island, an empty comment like the server writes,
 * which makes it patch, and wait for the observer. The node is removed again so that the body only holds the result.
 * @param {Window} window
 */
async function follow(window) {
	const next = window.document.createComment('');
	window.document.body.appendChild(next);
	await tick();
	next.remove();
}

/**
 * Add a chunk as the parser would: the island and then the node after it.
 * @param {Window} window
 * @param {string} id
 * @param {string} content
 */
async function streamChunk(window, id, content) {
	await appendIsland(window, createSubtree(id, content));
	await follow(window);
}

/**
 * Add a client render instruction and the node after it.
 * @param {Window} window
 * @param {string} id
 */
async function streamClientRender(window, id) {
	await appendIsland(window, createClientRenderInstruction(id));
	await follow(window);
}

describe('createSubtree', () => {
	it('should wrap content in a hidden preact-island that targets the id, followed by an empty comment', () => {
		expect(createSubtree('5', '<p>it works</p>')).toBe(
			'<preact-island hidden data-target="5"><p>it works</p></preact-island><!---->'
		);
	});

	it('should carry no nonce', () => {
		expect(createSubtree('5', '')).not.toContain('nonce');
	});
});

describe('createClientRenderInstruction', () => {
	it('should be an empty preact-island with data-x, followed by an empty comment', () => {
		expect(createClientRenderInstruction('a')).toBe(
			'<preact-island hidden data-target="a" data-x></preact-island><!---->'
		);
	});

	it('should carry no nonce', () => {
		expect(createClientRenderInstruction('a')).not.toContain('nonce');
	});
});

describe('createInitScript', () => {
	it('should emit a self-executing script that defines the preact-island element', () => {
		const html = createInitScript();
		expect(html.startsWith('<script>')).toBe(true);
		expect(html).toContain('customElements.define("preact-island"');
		expect(html).toContain('MutationObserver');
		expect(html).toContain('DOMContentLoaded');
		expect(html).toContain('svg,math');
		expect(html).toContain('})(document)');
		expect(html.endsWith('</script>')).toBe(true);
	});

	it('should put the nonce on the script', () => {
		expect(
			createInitScript('abc"').startsWith('<script nonce="abc&quot;">')
		).toBe(true);
	});
});

describe('inline init script', () => {
	const islands = (document) => document.querySelectorAll('preact-island');
	const domContentLoaded = (window) =>
		window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

	it('should replace the fallback between the markers with the island content once a node follows', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div>'
		);
		expect(islands(document)).toHaveLength(0);
	});

	it('should not patch while the island is the last child', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);

		await appendIsland(window, createSubtree('1', '<p>resolved</p>'));

		expect(findComment(document, '$s?1')).not.toBeNull();
		expect(document.body.innerHTML).toContain(range('1'));
		expect(islands(document)).toHaveLength(1);

		await follow(window);

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div>'
		);
		expect(islands(document)).toHaveLength(0);
	});

	it('should move the island children instead of cloning them', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		await appendIsland(window, createSubtree('1', '<p>resolved</p>'));
		const p = document.querySelector('preact-island p');

		await follow(window);

		expect(document.querySelector('p')).toBe(p);
	});

	it('should patch independent boundaries one by one', async () => {
		const { window, document } = await createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);

		await streamChunk(window, '2', '<p>two</p>');
		expect(findComment(document, '$s=')).toBe(
			findComment(document, '/$s?2').previousSibling.previousSibling
		);
		expect(findComment(document, '$s?1')).not.toBeNull();

		await streamChunk(window, '1', '<p>one</p>');
		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>one</p><!--/$s?1--><!--$s=--><p>two</p><!--/$s?2--></div>'
		);
	});

	it('should patch a nested boundary that came with the outer chunk in a later island', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);

		await streamChunk(window, '1', `<section>${range('2', 'inner')}</section>`);
		expect(findComment(document, '$s?2')).not.toBeNull();

		await streamChunk(window, '2', '<p>inner</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><section><!--$s=--><p>inner</p><!--/$s?2--></section><!--/$s?1--></div>'
		);
		expect(islands(document)).toHaveLength(0);
	});

	it('should call __w of the opening marker once the range is patched', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const calls = [];
		findComment(document, '$s?1').__w = function () {
			calls.push([this.data, this.nextSibling.textContent]);
		};

		await streamChunk(window, '1', 'done');

		expect(calls).toEqual([['$s=', 'done']]);
	});

	it('should not touch a range that is already patched', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		await streamChunk(window, '1', 'first');
		const start = findComment(document, '$s=');
		let woken = 0;
		start.__w = () => woken++;

		await streamChunk(window, '1', 'second');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s=-->first<!--/$s?1--></div>'
		);
		expect(woken).toBe(0);
		expect(islands(document)).toHaveLength(0);
	});

	it('should patch an empty island as an empty range, not a client render', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		let woken = 0;
		start.__w = () => woken++;

		await streamChunk(window, '1', '');

		expect(document.body.innerHTML).toBe('<div><!--$s=--><!--/$s?1--></div>');
		expect(start.data).toBe('$s=');
		expect(woken).toBe(1);
		expect(islands(document)).toHaveLength(0);
	});

	it('should patch a range that is in a detached subtree', async () => {
		const { window, document } = await createDom(
			`<div id="a">${range('1')}</div><div id="b"></div>`
		);
		// the first island indexes the markers that are in the document
		await streamChunk(window, 'none', '');
		const detached = document.querySelector('#a');
		detached.remove();

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(detached.innerHTML).toBe('<!--$s=--><p>resolved</p><!--/$s?1-->');
		expect(islands(document)).toHaveLength(0);
	});

	it('should hand the range to the client with data-x and keep the fallback', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		let woken = 0;
		start.__w = () => woken++;

		await streamClientRender(window, '1');

		expect(document.body.innerHTML).toBe(
			`<div>${range('1').replace('$s?1', '$s!')}</div>`
		);
		expect(start.data).toBe('$s!');
		expect(woken).toBe(1);
		expect(islands(document)).toHaveLength(0);
	});

	it('should keep the fallback and drop the content when data-x comes with content', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');

		await appendIsland(
			window,
			'<preact-island hidden data-target="1" data-x><p>resolved</p></preact-island>'
		);
		await follow(window);

		expect(document.body.innerHTML).toBe(
			`<div>${range('1').replace('$s?1', '$s!')}</div>`
		);
		expect(start.data).toBe('$s!');
	});

	it('should drop the range when the client unmounted it while pending', async () => {
		const { window, document } = await createDom(
			`<div>${range('1')}<i>after</i></div>`
		);
		findComment(document, '$s?1').__w = 0;

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe('<div><i>after</i></div>');
		expect(islands(document)).toHaveLength(0);
	});

	it('should drop the range with data-x or empty content too when it was unmounted', async () => {
		const { window, document } = await createDom(
			`<div>${range('1')}</div><div>${range('2')}</div>`
		);
		findComment(document, '$s?1').__w = 0;
		findComment(document, '$s?2').__w = 0;

		await streamClientRender(window, '1');
		await streamChunk(window, '2', '');

		expect(document.body.innerHTML).toBe('<div></div><div></div>');
	});

	it('should hand the range of a cut-off island to the client on DOMContentLoaded', async () => {
		const { window, document } = await createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);
		const first = findComment(document, '$s?1');
		const second = findComment(document, '$s?2');
		let woken = 0;
		first.__w = () => woken++;
		second.__w = () => woken++;
		// nothing follows this island: the response ended in the middle of it
		await appendIsland(window, createSubtree('1', '<p>one</p>'));
		expect(islands(document)).toHaveLength(1);

		domContentLoaded(window);

		expect(document.body.innerHTML).toBe(
			`<div>${range('1', 'a').replace('$s?1', '$s!')}${range('2', 'b').replace('$s?2', '$s!')}</div>`
		);
		// both ranges are handed to the client: the cut-off one and the one no
		// island came for
		expect(woken).toBe(2);
		expect(islands(document)).toHaveLength(0);
	});

	it('should patch a complete island that is still in the document on DOMContentLoaded', async () => {
		const { window, document } = await createDom(
			`<div>${range('1', 'a')}</div>`
		);
		await appendIsland(window, createSubtree('1', '<p>one</p>'));
		// the node after it, before its observer ran
		document.body.append(document.createComment(''));

		domContentLoaded(window);

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s=--><p>one</p><!--/$s?1-->'
		);
		expect(islands(document)).toHaveLength(0);
	});

	it('should remove the empty comment after the island with it', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		await appendIsland(window, createSubtree('1', '<p>resolved</p>'));
		const comment = document.createComment('');
		document.body.appendChild(comment);
		await tick();

		expect(comment.isConnected).toBe(false);
		expect(islands(document)).toHaveLength(0);
		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div>'
		);
	});

	it('should leave a non-empty comment after the island alone', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		await appendIsland(window, createSubtree('1', '<p>resolved</p>'));
		document.body.appendChild(document.createComment('keep'));
		await tick();

		expect(islands(document)).toHaveLength(0);
		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div><!--keep-->'
		);
	});

	it('should keep working when the init script runs twice', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const html = createInitScript();
		expect(() =>
			window.eval(html.slice('<script>'.length, -'</script>'.length))
		).not.toThrow();
		await appendIsland(window, createSubtree('1', '<p>resolved</p>'));
		document.body.appendChild(document.createComment(''));
		await tick();

		expect(islands(document)).toHaveLength(0);
		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div>'
		);
	});

	it('should leave another node after the island alone', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		await appendIsland(window, createSubtree('1', '<p>resolved</p>'));
		document.body.appendChild(document.createElement('i'));
		await tick();

		expect(islands(document)).toHaveLength(0);
		expect(document.body.innerHTML).toBe(
			'<div><!--$s=--><p>resolved</p><!--/$s?1--></div><i></i>'
		);
	});

	it('should still patch an island that was taken out of the document once a node follows it', async () => {
		const { document } = await createDom(
			`<div id="a">${range('1')}</div><div id="host"></div>`
		);
		const host = document.getElementById('host');
		const template = document.createElement('template');
		template.innerHTML = createSubtree('1', '<p>resolved</p>');
		host.appendChild(template.content.firstChild);
		await tick();
		host.remove();
		expect(host.isConnected).toBe(false);

		host.appendChild(document.createComment(''));
		await tick();

		expect(document.getElementById('a').innerHTML).toBe(
			'<!--$s=--><p>resolved</p><!--/$s?1-->'
		);
		expect(host.querySelector('preact-island')).toBeNull();
		expect(host.childNodes).toHaveLength(0);
	});

	it('should hand a range to the client on DOMContentLoaded for an island with data-x', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const start = findComment(document, '$s?1');
		await appendIsland(window, createClientRenderInstruction('1'));

		domContentLoaded(window);

		expect(start.data).toBe('$s!');
		expect(islands(document)).toHaveLength(0);
	});

	it('should remove unmounted ranges on DOMContentLoaded', async () => {
		const { window, document } = await createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);
		findComment(document, '$s?1').__w = 0;
		let woken = 0;
		findComment(document, '$s?2').__w = () => woken++;

		domContentLoaded(window);

		expect(document.body.innerHTML).toBe(
			`<div>${range('2', 'b').replace('$s?2', '$s!')}</div>`
		);
		expect(findComment(document, '$s?1')).toBe(null);
		expect(woken).toBe(1);
	});

	it('should hand a range that is still waiting to the client on DOMContentLoaded', async () => {
		const { window, document } = await createDom(
			`<div>${range('1', 'a')}${range('2', 'b')}</div>`
		);
		const waiting = findComment(document, '$s?1');
		let woken = 0;
		waiting.__w = () => woken++;

		domContentLoaded(window);

		expect(waiting.data).toBe('$s!');
		expect(woken).toBe(1);
		// no boundary waits on this one
		expect(findComment(document, '$s?2')).not.toBe(null);
	});

	it('should not remove a range on DOMContentLoaded that the client has not unmounted', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		const before = document.body.innerHTML;

		domContentLoaded(window);

		expect(document.body.innerHTML).toBe(before);
	});

	it('should not touch a patched range on DOMContentLoaded', async () => {
		const { window, document } = await createDom(`<div>${range('1')}</div>`);
		await streamChunk(window, '1', '<p>resolved</p>');
		const start = findComment(document, '$s=');
		let woken = 0;
		start.__w = () => woken++;

		domContentLoaded(window);

		expect(start.data).toBe('$s=');
		expect(woken).toBe(0);
	});

	it('should remove the island when the markers are missing', async () => {
		const { window, document } = await createDom('<div><i>client</i></div>');
		const errors = [];
		window.addEventListener('error', (e) => errors.push(e.error));

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(errors).toEqual([]);
		expect(document.body.innerHTML).toBe('<div><i>client</i></div>');
		expect(islands(document)).toHaveLength(0);
	});

	it('should leave the range alone when only its closing marker is left', async () => {
		const { window, document } = await createDom(
			'<div><i>client</i><!--/$s?1--></div>'
		);

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><i>client</i><!--/$s?1--></div>'
		);
		expect(islands(document)).toHaveLength(0);
	});

	it('should leave the range alone when only its opening marker is left', async () => {
		const { window, document } = await createDom('<div><!--$s?1-->a</div>');

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe('<div><!--$s?1-->a</div>');
		expect(islands(document)).toHaveLength(0);
	});

	it('should leave the range alone when the markers have different parents', async () => {
		const { window, document } = await createDom(
			'<div><!--$s?1-->a</div><div>b<!--/$s?1--></div>'
		);

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(document.body.innerHTML).toBe(
			'<div><!--$s?1-->a</div><div>b<!--/$s?1--></div>'
		);
		expect(islands(document)).toHaveLength(0);
	});

	it('should not throw when the closing marker precedes the opening marker', async () => {
		const { window, document } = await createDom(
			`<div><!--/$s?1-->${range('1')}</div>`
		);
		const errors = [];
		window.addEventListener('error', (e) => errors.push(e.error));

		await streamChunk(window, '1', '<p>content</p>');

		expect(errors).toEqual([]);
		expect(islands(document)).toHaveLength(0);
	});

	it('should parse the patched children in the svg and math namespace of their parent', async () => {
		const { window, document } = await createDom(
			`<svg>${range('1', '')}</svg><math>${range('2', '')}</math>`
		);

		await streamChunk(window, '1', '<path></path>');
		await streamChunk(window, '2', '<mi>x</mi>');

		expect(document.querySelector('path').namespaceURI).toBe(SVG);
		expect(document.querySelector('mi').namespaceURI).toBe(MATHML);
	});

	it('should turn an img back into an image element in svg', async () => {
		const { window, document } = await createDom(
			`<svg>${range('1', '')}</svg>`
		);

		await streamChunk(window, '1', '<image href="a.png"></image>');

		const image = document.querySelector('svg image');
		expect(image).not.toBeNull();
		expect(image.namespaceURI).toBe(SVG);
		expect(image.getAttribute('href')).toBe('a.png');
		expect(document.querySelector('img')).toBeNull();
	});

	it('should patch a nested boundary in an svg after the outer one was reparsed', async () => {
		const { window, document } = await createDom(
			`<svg>${range('1', '')}</svg>`
		);

		await streamChunk(window, '1', `<g>${range('2', '')}</g>`);
		await streamChunk(window, '2', '<path></path>');

		const path = document.querySelector('path');
		expect(path.namespaceURI).toBe(SVG);
		expect(path.parentNode.localName).toBe('g');
		expect(findComment(document, '$s?2')).toBeNull();
	});

	it('should leave HTML inside foreignObject in the HTML namespace', async () => {
		const { window, document } = await createDom(
			`<svg>${range('1', '')}</svg>`
		);

		await streamChunk(
			window,
			'1',
			'<foreignObject><div id="h">t</div></foreignObject>'
		);

		const inner = document.getElementById('h');
		expect(inner.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(inner.textContent).toBe('t');
	});

	it('should not reparse unrelated svg elements', async () => {
		const { window, document } = await createDom(
			`<svg><circle></circle></svg><div>${range('1')}</div>`
		);
		const circle = document.querySelector('circle');

		await streamChunk(window, '1', '<p>resolved</p>');

		expect(document.querySelector('circle')).toBe(circle);
	});
});
