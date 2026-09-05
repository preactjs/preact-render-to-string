import { describe, it, expect, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { h, render } from 'preact';
import { createInitScript, createSubtree } from '../src/lib/client';

let dom;
const previousDocument = globalThis.document;
afterEach(() => {
	dom.window.close();
	globalThis.document = previousDocument;
});

function setup(
	html = '<div id="root"><!--$s:1--><i>loading</i><!--/$s:1--></div>'
) {
	dom = new JSDOM(html, {
		runScripts: 'dangerously',
		url: 'http://localhost/'
	});
	const { window } = dom;
	globalThis.document = window.document;
	const frames = [];
	window.requestAnimationFrame = (callback) => frames.push(callback);
	const script = createInitScript();
	window.eval(script.slice('<script>'.length, -'</script>'.length));
	return {
		document: window.document,
		root: window.document.querySelector('#root'),
		flush: () => frames.splice(0).forEach((callback) => callback())
	};
}

function appendIsland(document, content = '<button>server</button>') {
	document.body.insertAdjacentHTML('beforeend', createSubtree('1', content));
}

function renderClient(root, children) {
	root.replaceChildren();
	render(children, root);
	// Keep the stream anchors, as resumed hydration does in Preact 11.
	root.prepend(document.createComment('$s:1'));
	root.append(document.createComment('/$s:1'));
}

describe('stream island races', () => {
	it('should replace a fallback that has no client-rendered nodes', () => {
		const { document, root, flush } = setup();
		appendIsland(document);
		flush();
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>server</button><!--/$s:1-->'
		);
		expect(document.querySelector('preact-island')).toBeNull();
	});

	it('should preserve client nodes rendered before the island connects', () => {
		const { document, root, flush } = setup();
		let clicks = 0;
		renderClient(root, <button onClick={() => clicks++}>client</button>);
		const button = root.querySelector('button');
		const fallback = document.createElement('i');
		fallback.textContent = 'loading';
		root.insertBefore(fallback, root.lastChild);
		appendIsland(document);
		flush();
		expect(root.querySelector('button')).toBe(button);
		expect(root.textContent).toBe('client');
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('preact-island')).toBeNull();
	});

	it('should recheck client ownership after the animation frame is queued', () => {
		const { document, root, flush } = setup();
		appendIsland(document);
		// Preserve the same anchors, but let the client create content between them.
		const start = root.firstChild;
		const end = root.lastChild;
		let clicks = 0;
		root.replaceChildren();
		render(<button onClick={() => clicks++}>client</button>, root);
		root.prepend(start);
		root.append(end);
		const button = root.querySelector('button');
		flush();
		expect(root.querySelector('button')).toBe(button);
		button.click();
		expect(clicks).toBe(1);
		expect(document.querySelector('preact-island')).toBeNull();
	});

	it('should discard an island when hydration removed the anchors before its frame', () => {
		const { document, root, flush } = setup();
		appendIsland(document);
		root.replaceChildren();
		render(<button>client</button>, root);
		const button = root.firstChild;
		expect(() => flush()).not.toThrow();
		expect(root.firstChild).toBe(button);
		expect(root.textContent).toBe('client');
		expect(document.querySelector('preact-island')).toBeNull();
	});

	it('should discard an island when its boundary has already disappeared', () => {
		const { document, root, flush } = setup();
		root.replaceChildren();
		render(<button>client</button>, root);
		appendIsland(document);
		flush();
		expect(root.textContent).toBe('client');
		expect(document.querySelector('preact-island')).toBeNull();
	});

	it('should preserve client text and multiple sibling elements', () => {
		const { document, root, flush } = setup();
		renderClient(root, ['client text', <button>one</button>, <span>two</span>]);
		const nodes = Array.from(root.childNodes);
		appendIsland(document, '<button>server</button><span>server</span>');
		flush();
		expect(root.childNodes.length).toBe(nodes.length);
		nodes.forEach((node, i) => expect(root.childNodes[i]).toBe(node));
		expect(root.textContent).toBe('client textonetwo');
	});
	it('should not mistake a hydrated sibling outside the boundary for resolved content', () => {
		const { document, root, flush } = setup();
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
		appendIsland(document);
		flush();
		expect(section.textContent).toBe('server');
		expect(root.querySelector('button').textContent).toBe('outside');
	});

	it('should preserve input state even when the element has no DOM mutations', () => {
		const { document, root, flush } = setup();
		renderClient(root, <input defaultValue="initial" />);
		const input = root.querySelector('input');
		input.value = 'edited';
		appendIsland(document, '<input value="initial">');
		flush();
		expect(root.querySelector('input')).toBe(input);
		expect(input.value).toBe('edited');
	});

	it('should retain nested suspended boundaries while discarding the outer patch', () => {
		const { document, root, flush } = setup();
		renderClient(root, <button>client</button>);
		root
			.querySelector('button')
			.insertAdjacentHTML(
				'afterend',
				'<!--$s:2--><i>nested fallback</i><!--/$s:2-->'
			);
		appendIsland(document);
		flush();
		expect(root.innerHTML).toBe(
			'<!--$s:1--><button>client</button><!--$s:2--><i>nested fallback</i><!--/$s:2--><!--/$s:1-->'
		);
	});
});
