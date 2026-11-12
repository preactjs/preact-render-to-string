import { describe, it, expect, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { h, render } from 'preact';
import {
	createInitScript,
	createSubtree,
	createClientRenderInstruction
} from '../src/lib/client';

/**
 * Wrap what is between `$s` markers the way the renderer wraps a fallback it is
 * still streaming the content for.
 * @param {string} html
 */
function pending(html) {
	return html.replace(
		/(<!--\$s:(\w+)-->)([^]*?)(<!--\/\$s:\2-->)/g,
		(_, start, id, fallback, end) =>
			`${start}<?start name="${id}">${pending(fallback)}<?end>${end}`
	);
}

/**
 * A pending shell as the parser leaves it: without processing instructions
 * `<?start>` and `<?end>` are comments.
 * @param {string} html
 */
function parsed(html) {
	return pending(html).replace(/<\?([^>]*)>/g, '<!--?$1-->');
}

/**
 * @param {string} [bodyHtml] The shell, its boundaries are pending
 */
function createDom(bodyHtml = '') {
	const dom = new JSDOM(
		`<!DOCTYPE html><html><body>${pending(bodyHtml)}</body></html>`,
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
 * Body markup of the document.
 * @param {Document} document
 */
function bodyHtml(document) {
	return document.body.innerHTML;
}

/**
 * Insert a streamed chunk without running its script (scripts inserted through
 * innerHTML never execute, same as in a parser-less test DOM).
 * @param {Document} document
 * @param {string} id
 * @param {string} html
 */
function insertChunk(document, id, html) {
	document.body.insertAdjacentHTML(
		'beforeend',
		createSubtree(id, pending(html))
	);
	// the inert chunk script is dropped; callRC stands in for it
	document.body.lastElementChild.remove();
}

/**
 * Run the call the chunk's inline script makes.
 * @param {Window} window
 * @param {string} id
 */
function callRC(window, id) {
	const script = window.document.createElement('script');
	script.dataset.p = id;
	script.textContent = '$PRS()';
	window.document.body.appendChild(script);
}

/**
 * Insert a chunk and run its script, like the browser does while parsing it.
 * @param {Window} window
 * @param {string} id
 * @param {string} html
 */
function streamChunk(window, id, html) {
	insertChunk(window.document, id, html);
	callRC(window, id);
}

describe('createSubtree', () => {
	it('should wrap content in a template with a for attribute followed by an $PRS call', () => {
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

describe('createInitScript', () => {
	it('should emit a self-executing script that defines $PRS', () => {
		const html = createInitScript();
		expect(html).toContain('<script>');
		expect(html).toContain('window.$PRS=');
		expect(html).toContain('svg,math');
		expect(html).toContain('(e=>{');
		expect(html).toContain('})(document)');
		expect(html).not.toContain('MutationObserver');
		expect(html).toContain('</script>');
	});
});

describe('inline init script', () => {
	it('should replace fallback content between $s markers with template content', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading...<!--/$s:1--></div>'
		);

		runInitScript(window);
		streamChunk(window, '1', '<p>resolved</p>');

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>resolved</p><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should remove the chunk script after patching', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		callRC(window, '1');

		expect(document.querySelectorAll('script')).toHaveLength(0);
	});

	it('should leave markers in place after patching', () => {
		const { window, document } = createDom(
			'<div><!--$s:9-->fallback<!--/$s:9--></div>'
		);

		runInitScript(window);
		streamChunk(window, '9', '<span>ok</span>');

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

	it('should patch multiple suspense boundaries independently', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--><!--$s:2-->b<!--/$s:2--></div>'
		);

		runInitScript(window);
		streamChunk(window, '2', '<p>two</p>');
		expect(document.querySelector('div').innerHTML).toBe(
			parsed('<!--$s:1-->a<!--/$s:1-->') + '<!--$s:2--><p>two</p><!--/$s:2-->'
		);

		streamChunk(window, '1', '<p>one</p>');
		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>one</p><!--/$s:1--><!--$s:2--><p>two</p><!--/$s:2--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should continue patching later chunks when an earlier one has no markers', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		streamChunk(window, 'missing', '<p>skip</p>');
		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><p>resolved</p><!--/$s:1-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should drop templates that do not match any suspense markers', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		streamChunk(window, '999', '<p>nope</p>');

		expect(bodyHtml(document)).toBe(
			parsed('<div><!--$s:1-->loading<!--/$s:1--></div>')
		);
	});

	it('should leave the boundary alone when its start marker is gone', () => {
		const { window, document } = createDom(
			'<div><i>client</i><!--/$s:1--></div>'
		);
		const errors = [];
		window.addEventListener('error', (e) => errors.push(e.error));

		runInitScript(window);
		streamChunk(window, '1', '<p>resolved</p>');
		// native DPU: no template left for the script to find
		callRC(window, '1');

		expect(errors).toEqual([]);
		expect(bodyHtml(document)).toBe('<div><i>client</i><!--/$s:1--></div>');
		expect(document.querySelectorAll('template, script')).toHaveLength(0);
	});

	it('should still patch templates when htmlFor is present on HTMLTemplateElement', () => {
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
		streamChunk(window, '1', '<p>resolved</p>');

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><p>resolved</p><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should patch a chunk with empty content', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->loading<!--/$s:1--></div>'
		);

		runInitScript(window);
		streamChunk(window, '1', '');

		expect(document.querySelector('div').innerHTML).toBe(
			'<!--$s:1--><!--/$s:1-->'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should not rescan the document before $PRS is called', () => {
		const { window, document } = createDom('<div id="app"></div>');
		runInitScript(window);

		let scans = 0;
		// a scan is the comment marker walk done when a chunk is patched
		const createNodeIterator = document.createNodeIterator.bind(document);
		document.createNodeIterator = (...args) => {
			scans++;
			return createNodeIterator(...args);
		};

		document
			.querySelector('#app')
			.append(document.createElement('p'), document.createComment('x'));
		expect(scans).toBe(0);

		streamChunk(window, '1', '<p>resolved</p>');
		expect(scans).toBeGreaterThan(0);
	});

	it('should find the markers of all boundaries with a single document scan', () => {
		const n = 20;
		let shell = '';
		for (let i = 0; i < n; i++) shell += `<!--$s:${i}-->loading<!--/$s:${i}-->`;
		const { window, document } = createDom(`<div>${shell}</div>`);
		runInitScript(window);

		let iterators = 0;
		let queries = 0;
		const createNodeIterator = document.createNodeIterator.bind(document);
		document.createNodeIterator = (...args) => {
			iterators++;
			return createNodeIterator(...args);
		};
		for (const name of ['querySelector', 'querySelectorAll']) {
			const fn = document[name].bind(document);
			document[name] = (...args) => {
				queries++;
				return fn(...args);
			};
		}

		for (let i = n - 1; i >= 0; i--)
			streamChunk(window, String(i), `<p>${i}</p>`);

		// one live iterator, resumed by every call, and no document-wide template query
		expect(iterators).toBe(1);
		expect(queries).toBe(0);
		expect(document.querySelectorAll('p')).toHaveLength(n);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should find markers added to the document after an earlier chunk', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->a<!--/$s:1--></div>'
		);
		runInitScript(window);
		streamChunk(window, '1', '<p>one</p>');

		document.body.insertAdjacentHTML(
			'beforeend',
			pending('<section><!--$s:2-->b<!--/$s:2--></section>')
		);
		streamChunk(window, '2', '<p>two</p>');

		expect(document.querySelector('section').innerHTML).toBe(
			'<!--$s:2--><p>two</p><!--/$s:2-->'
		);
	});

	it('should patch a nested boundary whose markers came with the outer chunk', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->outer fallback<!--/$s:1--></div>'
		);
		runInitScript(window);

		streamChunk(
			window,
			'1',
			'<section><!--$s:2-->inner fallback<!--/$s:2--></section>'
		);
		streamChunk(window, '2', '<p>inner</p>');

		expect(bodyHtml(document)).toBe(
			'<div><!--$s:1--><section><!--$s:2--><p>inner</p><!--/$s:2--></section><!--/$s:1--></div>'
		);
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should find nested markers that native DPU patched in', () => {
		const { window, document } = createDom(
			'<div><!--$s:1-->outer fallback<!--/$s:1--></div>'
		);
		runInitScript(window);
		// let the iterator pass the outer markers before native DPU patches the range
		callRC(window, 'none');

		const end = document.querySelector('div').lastChild;
		end.previousSibling.remove();
		const tmp = document.createElement('div');
		tmp.innerHTML = '<svg><!--$s:2--><rect></rect><!--/$s:2--></svg>';
		end.before(tmp.firstChild);
		callRC(window, '1');
		// native DPU leaves the nested svg children in the HTML namespace
		const svg = document.querySelector('svg');
		svg.lastChild.before(document.createElement('circle'));
		svg.querySelector('rect').remove();
		callRC(window, '2');

		expect(document.querySelector('circle').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
	});

	it('should find nested markers that the namespace fix recreated', () => {
		const { window, document } = createDom(
			'<svg><!--$s:1--><circle></circle><!--/$s:1--></svg>'
		);
		runInitScript(window);

		// native DPU patched the range before the chunk's script runs
		const svg = document.querySelector('svg');
		while (svg.childNodes.length > 2) svg.childNodes[1].remove();
		const g = document.createElement('g');
		g.innerHTML = pending('<!--$s:2--><!--/$s:2-->');
		svg.lastChild.before(g);
		callRC(window, '1');
		streamChunk(window, '2', '<path></path>');

		expect(document.querySelector('path').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(document.querySelector('path').parentNode.localName).toBe('g');
	});

	it('should not throw when an end marker precedes its start marker', () => {
		const { window, document } = createDom(
			'<div><!--/$s:1--><!--$s:1-->loading<!--/$s:1--></div>'
		);
		runInitScript(window);

		expect(() => streamChunk(window, '1', '<p>content</p>')).not.toThrow();
		expect(document.querySelectorAll('template')).toHaveLength(0);
	});

	it('should parse patched children in the svg/math namespace of their parent', () => {
		const { window, document } = createDom(
			'<svg><!--$s:1--><!--/$s:1--></svg><math><!--$s:2--><!--/$s:2--></math>'
		);

		runInitScript(window);
		streamChunk(window, '1', '<path></path>');
		streamChunk(window, '2', '<mi>x</mi>');

		expect(document.querySelector('path').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(document.querySelector('mi').namespaceURI).toBe(
			'http://www.w3.org/1998/Math/MathML'
		);
	});

	it('should fix the svg/math namespace after native DPU patched the range', () => {
		const { window, document } = createDom(
			'<svg><!--$s:1--><circle></circle><!--/$s:1--></svg><math><!--$s:2--><mn>1</mn><!--/$s:2--></math>'
		);
		runInitScript(window);

		// Native DPU swaps the range between <?start>/<?end> and consumes the template,
		// leaving HTML-namespace elements behind in the svg/math parent.
		for (const [id, tag] of [
			['1', 'rect'],
			['2', 'mi']
		]) {
			const end = [...document.querySelectorAll('svg, math')]
				.flatMap((el) => [...el.childNodes])
				.find((n) => n.data === '/$s:' + id);
			end.previousSibling.remove();
			end.before(document.createElement(tag));
			// the chunk's script runs after the (absent) template: no template, so only fixups
			callRC(window, id);
		}

		expect(document.querySelector('rect').namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(document.querySelector('mi').namespaceURI).toBe(
			'http://www.w3.org/1998/Math/MathML'
		);
	});

	it('should not reparse unrelated svg or math elements', () => {
		const { window, document } = createDom(
			'<svg><circle></circle></svg><div><!--$s:1-->loading<!--/$s:1--></div>'
		);
		const circle = document.querySelector('circle');

		runInitScript(window);
		streamChunk(window, '1', '<p>resolved</p>');

		expect(document.querySelector('circle')).toBe(circle);
	});
});

let hydrationDom;
const previousDocument = globalThis.document;
async function setupHydration(
	html = '<div id="root"><!--$s:1--><i>loading</i><!--/$s:1--></div>'
) {
	hydrationDom = new JSDOM(pending(html), {
		runScripts: 'dangerously',
		url: 'http://localhost/'
	});
	const { window } = hydrationDom;
	globalThis.document = window.document;
	const script = createInitScript();
	window.eval(script.slice('<script>'.length, -'</script>'.length));
	return {
		document: window.document,
		root: window.document.querySelector('#root')
	};
}

function appendStreamed(document, content = '<button>server</button>') {
	insertChunk(document, '1', content);
	callRC(hydrationDom.window, '1');
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
		const { document, root } = await setupHydration();
		appendStreamed(document);
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>server</button><!--/$s:1-->'
		);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should preserve client nodes rendered before the template arrives', async () => {
		const { document, root } = await setupHydration();
		let clicks = 0;
		renderClient(root, <button onClick={() => clicks++}>client</button>);
		const button = root.querySelector('button');
		const fallback = document.createElement('i');
		fallback.textContent = 'loading';
		root.insertBefore(fallback, root.lastChild);
		appendStreamed(document);
		expect(root.querySelector('button')).toBe(button);
		// Unowned fallback nodes are left for hydration to clean up.
		expect(root.textContent).toBe('clientloading');
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should preserve client text and multiple sibling elements', async () => {
		const { document, root } = await setupHydration();
		renderClient(root, ['client text', <button>one</button>, <span>two</span>]);
		const nodes = Array.from(root.childNodes);
		appendStreamed(document, '<button>server</button><span>server</span>');
		expect(root.childNodes.length).toBe(nodes.length);
		nodes.forEach((node, i) => expect(root.childNodes[i]).toBe(node));
		expect(root.textContent).toBe('client textonetwo');
		expect(document.querySelector('template')).toBeNull();
	});

	it('should keep client nodes created after the template was queued', async () => {
		const { document, root } = await setupHydration();
		// The template is already in the document when the client renders.
		insertChunk(document, '1', '<button>server</button>');
		const start = root.firstChild;
		const end = root.lastChild;
		let clicks = 0;
		root.replaceChildren();
		render(<button onClick={() => clicks++}>client</button>, root);
		root.prepend(start);
		root.append(end);
		const button = root.querySelector('button');
		callRC(hydrationDom.window, '1');
		expect(root.querySelector('button')).toBe(button);
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should not throw when hydration removed the anchors', async () => {
		const { document, root } = await setupHydration();
		root.replaceChildren();
		render(<button>client</button>, root);
		const button = root.firstChild;
		appendStreamed(document);
		expect(root.firstChild).toBe(button);
		expect(root.textContent).toBe('client');
		expect(document.querySelector('template')).toBeNull();
	});

	it('should drop the template of a nested boundary that never reached the document', async () => {
		const { document, root } = await setupHydration();
		// The client rendered the outer boundary first, so the nested markers that came
		// with the outer chunk were never inserted.
		renderClient(root, <button>client</button>);
		appendStreamed(
			document,
			'<button>server</button><!--$s:2--><i>nested fallback</i><!--/$s:2-->'
		);
		insertChunk(document, '2', '<p>nested</p>');
		callRC(hydrationDom.window, '2');
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>client</button><!--/$s:1-->'
		);
		expect(document.querySelector('template')).toBeNull();
	});

	it('should not mistake a hydrated sibling outside the boundary for resolved content', async () => {
		const { document, root } = await setupHydration();
		root.replaceChildren();
		render(
			<main>
				<button>outside</button>
				<section />
			</main>,
			root
		);
		const section = root.querySelector('section');
		section.innerHTML = pending('<!--$s:1--><i>loading</i><!--/$s:1-->');
		appendStreamed(document);
		expect(section.textContent).toBe('server');
		expect(root.querySelector('button').textContent).toBe('outside');
	});

	it('should not pull detached client DOM from elsewhere into the boundary', async () => {
		const { root } = await setupHydration();
		root.replaceChildren();
		render(
			<main>
				<div>
					<p>parked</p>
				</div>
				<section />
			</main>,
			root
		);
		const section = root.querySelector('section');
		section.innerHTML = '<!--$s:1--><b>server</b><!--/$s:1-->';
		// e.g. a suspended client subtree that is parked outside the document
		const parked = root.querySelector('p');
		parked.remove();
		// native DPU already patched the range, so there is no template
		callRC(hydrationDom.window, '1');
		expect(section.innerHTML).toBe('<!--$s:1--><b>server</b><!--/$s:1-->');
		expect(parked.parentNode).toBeNull();
	});

	it('should preserve input state even when the element has no DOM mutations', async () => {
		const { document, root } = await setupHydration();
		renderClient(root, <input defaultValue="initial" />);
		const input = root.querySelector('input');
		input.value = 'edited';
		appendStreamed(document, '<input value="initial">');
		expect(root.querySelector('input')).toBe(input);
		expect(input.value).toBe('edited');
	});

	it('should retain nested suspended boundaries while discarding the outer patch', async () => {
		const { document, root } = await setupHydration();
		renderClient(root, <button>client</button>);
		root
			.querySelector('button')
			.insertAdjacentHTML(
				'afterend',
				'<!--$s:2--><i>nested fallback</i><!--/$s:2-->'
			);
		appendStreamed(document);
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>client</button><!--$s:2--><i>nested fallback</i><!--/$s:2--><!--/$s:1-->'
		);
		expect(document.querySelector('template')).toBeNull();
	});
});

describe('stream recovery instructions', () => {
	function setup() {
		const { window, document } = createDom(
			'<div id="root"><!--$s:1--><i>loading</i><!--/$s:1--></div>'
		);
		return {
			root: document.querySelector('#root'),
			recover(id = '1') {
				const script = createClientRenderInstruction(id);
				window.eval(script.slice('<script>'.length, -'</script>'.length));
			}
		};
	}

	it('marks a fallback before hydration without replacing its DOM', () => {
		const { root, recover } = setup();
		const fallback = root.querySelector('i');
		recover();
		expect(root.firstChild.data).toBe('$s!:1');
		expect(root.querySelector('i')).toBe(fallback);
	});

	it('ignores a boundary removed before recovery arrives', () => {
		const { root, recover } = setup();
		root.replaceChildren();
		expect(() => recover()).not.toThrow();
		expect(root.innerHTML).toBe('');
	});
});
