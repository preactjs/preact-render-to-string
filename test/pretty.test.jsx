import basicRender from '../src/index.js';
import { render } from '../src/jsx.js';
import { h, Fragment } from 'preact';
import { useId } from 'preact/hooks';
import { expect, describe, it } from 'vitest';
import { dedent, svgAttributes, htmlAttributes } from './utils.jsx';

describe('pretty', () => {
	let prettyRender = (jsx, opts) => render(jsx, {}, { pretty: true, ...opts });

	it('should render no whitespace by default', () => {
		let rendered = basicRender(
			<section>
				<a href="/foo">foo</a>
				bar
				<p>hello</p>
			</section>
		);

		expect(rendered).to.equal(
			`<section><a href="/foo">foo</a>bar<p>hello</p></section>`
		);
	});

	it('should render whitespace when pretty=true', () => {
		let rendered = prettyRender(
			<section>
				<a href="/foo">foo</a>
				bar
				<p>hello</p>
			</section>
		);

		expect(rendered).to.equal(
			`<section>\n\t<a href="/foo">foo</a>\n\tbar\n\t<p>hello</p>\n</section>`
		);
	});

	it('should not indent for short children', () => {
		let fourty = '';
		for (let i = 40; i--; ) fourty += 'x';

		expect(
			prettyRender(<a href="/foo">{fourty}</a>),
			'<=40 characters'
		).to.equal(`<a href="/foo">${fourty}</a>`);

		expect(
			prettyRender(<a href="/foo">{fourty + 'a'}</a>),
			'>40 characters'
		).to.equal(`<a href="/foo">\n\t${fourty + 'a'}\n</a>`);
	});

	it('should handle self-closing tags', () => {
		expect(
			prettyRender(
				<div>
					hi
					<img src="a.jpg" />
					<img src="b.jpg" />
					<b>hi</b>
				</div>
			)
		).to.equal(
			`<div>\n\thi\n\t<img src="a.jpg" />\n\t<img src="b.jpg" />\n\t<b>hi</b>\n</div>`
		);
	});

	it('should support empty tags', () => {
		expect(
			prettyRender(
				<div>
					<span />
				</div>
			)
		).to.equal(`<div>\n\t<span></span>\n</div>`);
	});

	it('should not increase indentation with Fragments', () => {
		expect(
			prettyRender(
				<div>
					<Fragment>
						<span />
					</Fragment>
				</div>
			)
		).to.equal(`<div>\n\t<span></span>\n</div>`);
	});

	it('should not increase indentation with nested Fragments', () => {
		expect(
			prettyRender(
				<div>
					<Fragment>
						<Fragment>
							<span />
						</Fragment>
					</Fragment>
				</div>
			)
		).to.equal(`<div>\n\t<span></span>\n</div>`);
	});

	it('should not increase indentation with sibling Fragments', () => {
		expect(
			prettyRender(
				<div>
					<Fragment>
						<div>A</div>
					</Fragment>
					<Fragment>
						<div>B</div>
					</Fragment>
				</div>
			)
		).to.equal(`<div>\n\t<div>A</div>\n\t<div>B</div>\n</div>`);
	});

	it('should join adjacent text nodes', () => {
		// prettier-ignore
		expect(prettyRender(
			<div>hello{' '} <b /></div>
		)).to.equal(`<div>\n\thello  \n\t<b></b>\n</div>`);

		// prettier-ignore
		expect(prettyRender(
			<div>hello{' '} <b />{'a'}{'b'}</div>
		)).to.equal(`<div>\n\thello  \n\t<b></b>\n\tab\n</div>`);
	});

	it('should join adjacent text nodeswith Fragments', () => {
		// prettier-ignore
		expect(prettyRender(
			<div><Fragment>foo</Fragment>bar{' '} <b /></div>
		)).to.equal(`<div>\n\tfoobar  \n\t<b></b>\n</div>`);
	});

	it('should collapse whitespace', () => {
		expect(
			prettyRender(
				<p>
					a<a>b</a>
				</p>
			)
		).to.equal(`<p>\n\ta\n\t<a>b</a>\n</p>`);

		expect(
			prettyRender(
				<p>
					a <a>b</a>
				</p>
			)
		).to.equal(`<p>\n\ta \n\t<a>b</a>\n</p>`);

		expect(
			prettyRender(
				<p>
					a{''}
					<a>b</a>
				</p>
			)
		).to.equal(dedent`
			<p>
				a
				<a>b</a>
			</p>
		`);

		expect(
			prettyRender(
				<p>
					a <a>b</a>
				</p>
			)
		).to.equal(`<p>\n\ta \n\t<a>b</a>\n</p>`);

		expect(prettyRender(<a> b </a>)).to.equal(dedent`
			<a> b </a>
		`);

		expect(
			prettyRender(
				<p>
					<b /> a{' '}
				</p>
			)
		).to.equal(`<p>\n\t<b></b>\n\t a \n</p>`);
	});

	it('should prevent JSON injection', () => {
		expect(prettyRender(<div>{{ hello: 'world' }}</div>)).to.equal(
			'<div></div>'
		);
	});

	it('should not render function children', () => {
		expect(prettyRender(<div>{() => {}}</div>)).to.equal('<div></div>');
	});

	it('should render SVG elements', () => {
		let rendered = prettyRender(
			<svg>
				<image xlinkHref="#" />
				<foreignObject>
					<div xlinkHref="#" />
				</foreignObject>
				<g>
					<image xlinkHref="#" />
				</g>
			</svg>
		);

		expect(rendered).to.equal(
			`<svg>\n\t<image xlink:href="#"></image>\n\t<foreignObject>\n\t\t<div xlink:href="#"></div>\n\t</foreignObject>\n\t<g>\n\t\t<image xlink:href="#"></image>\n\t</g>\n</svg>`
		);
	});

	it('should not add whitespace to pre tag children', () => {
		let rendered = prettyRender(
			<pre>
				<code>hello</code>
			</pre>,
			{ jsx: false }
		);

		expect(rendered).to.equal(`<pre><code>hello</code></pre>`);
	});

	it('should maintain whitespace in textarea tag', () => {
		let rendered = prettyRender(<textarea>{'  hello\nworld  '}</textarea>, {
			jsx: false
		});

		expect(rendered).to.equal(`<textarea>  hello\nworld  </textarea>`);
	});

	describe('Attribute casing', () => {
		it('should have correct SVG casing', () => {
			for (let name in svgAttributes) {
				let value = svgAttributes[name];

				let rendered = prettyRender(
					<svg>
						<path {...{ [name]: 'foo' }} />
					</svg>
				);
				expect(rendered).to.equal(
					`<svg>\n\t<path ${value}="foo"></path>\n</svg>`
				);
			}
		});

		it('should have correct HTML casing', () => {
			for (let name in htmlAttributes) {
				let value = htmlAttributes[name];

				if (name === 'checked') {
					let rendered = prettyRender(<input type="checkbox" checked />, {
						jsx: false
					});
					expect(rendered).to.equal(`<input type="checkbox" checked />`);
					continue;
				} else {
					let rendered = prettyRender(<div {...{ [name]: 'foo' }} />);
					expect(rendered).to.equal(`<div ${value}="foo"></div>`);
				}
			}
		});
	});

	describe('useId', () => {
		it('should produce unique IDs for sibling components', () => {
			function Foo() {
				const id = useId();
				return <div id={id} />;
			}

			const App = () => {
				return (
					<>
						<Foo />
						<Foo />
					</>
				);
			};

			const html = render(<App />);
			// Each Foo component should have a unique ID
			expect(html).to.contain('id="P0-0"');
			expect(html).to.contain('id="P0-1"');
		});

		it('should produce unique IDs in nested components', () => {
			function Child() {
				const id = useId();
				return <span id={id} />;
			}

			function Parent() {
				const id = useId();
				return (
					<div id={id}>
						<Child />
					</div>
				);
			}

			const App = () => {
				return (
					<>
						<Parent />
						<Parent />
					</>
				);
			};

			const html = render(<App />);
			// Should have 4 unique IDs total (2 Parents + 2 Children)
			const idMatches = html.match(/id="P0-\d+"/g);
			expect(idMatches).to.have.length(4);
			// All IDs should be unique
			const uniqueIds = new Set(idMatches);
			expect(uniqueIds.size).to.equal(4);
		});
	});
});
