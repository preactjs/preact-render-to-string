import basicRender from '../src/index.js';
import { render } from '../src/jsx.js';
import { h, Fragment } from 'preact';
import { expect } from 'chai';
import { dedent } from './utils.js';

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

	it('transforms attributes with custom attributeHook option', () => {
		function attributeHook(name) {
			const DASHED_ATTRS = /^(acceptC|httpE|(clip|color|fill|font|glyph|marker|stop|stroke|text|vert)[A-Z])/;
			const CAMEL_ATTRS = /^(isP|viewB)/;
			const COLON_ATTRS = /^(xlink|xml|xmlns)([A-Z])/;
			const CAPITAL_REGEXP = /([A-Z])/g;
			if (CAMEL_ATTRS.test(name)) return name;
			if (DASHED_ATTRS.test(name))
				return name.replace(CAPITAL_REGEXP, '-$1').toLowerCase();
			if (COLON_ATTRS.test(name))
				return name.replace(CAPITAL_REGEXP, ':$1').toLowerCase();
			return name.toLowerCase();
		}

		const content = (
			<html>
				<head>
					<meta charSet="utf=8" />
					<meta httpEquiv="refresh" />
					<link rel="preconnect" href="https://foo.com" crossOrigin />
					<link rel="preconnect" href="https://bar.com" crossOrigin={false} />
				</head>
				<body>
					<img srcSet="foo.png, foo2.png 2x" />
					<svg xmlSpace="preserve" viewBox="0 0 10 10" fillRule="nonzero">
						<foreignObject>
							<div xlinkHref="#" />
						</foreignObject>
					</svg>
				</body>
			</html>
		);

		const expected =
			'<html>\n\t<head>\n\t\t<meta charset="utf=8" />\n\t\t<meta http-equiv="refresh" />\n\t\t<link rel="preconnect" href="https://foo.com" crossorigin />\n\t\t<link rel="preconnect" href="https://bar.com" />\n\t</head>\n\t<body>\n\t\t<img srcset="foo.png, foo2.png 2x" />\n\t\t<svg xml:space="preserve" viewBox="0 0 10 10" fill-rule="nonzero">\n\t\t\t<foreignObject>\n\t\t\t\t<div xlink:href="#"></div>\n\t\t\t</foreignObject>\n\t\t</svg>\n\t</body>\n</html>';

		const rendered = prettyRender(content, { attributeHook });
		expect(rendered).to.equal(expected);
	});
});
