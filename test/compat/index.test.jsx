import render from '../../src/index.js';
import * as compat from 'preact/compat';
import { createElement as h, Component, createContext } from 'preact/compat';
import { expect, describe, it } from 'vitest';

describe('compat', () => {
	it('should not duplicate class attribute when className is empty', async () => {
		let rendered = render(h('div', { className: '' }));
		let expected = `<div></div>`;

		expect(rendered).to.equal(expected);
	});

	it('should mark the content of a Suspense boundary', () => {
		expect(
			render(
				<div>
					<compat.Suspense fallback="loading...">
						<p>ready</p>
					</compat.Suspense>
				</div>
			)
		).to.equal('<div><!--$s=--><p>ready</p><!--/$s--></div>');
	});

	it('should mark nested Suspense boundaries and an empty one', () => {
		expect(
			render(
				<compat.Suspense fallback="a">
					<compat.Suspense fallback="b">x</compat.Suspense>
					<compat.Suspense fallback="c" />
				</compat.Suspense>
			)
		).to.equal('<!--$s=--><!--$s=-->x<!--/$s--><!--$s=--><!--/$s--><!--/$s-->');
	});

	it('should not mark components that are not Suspense boundaries', () => {
		// like preact-iso, it sets the handler on the instance only
		class Fake extends Component {
			constructor(props) {
				super(props);
				this.__c = () => {};
			}
			render() {
				return <b>x</b>;
			}
		}
		expect(render(<Fake />)).to.equal('<b>x</b>');
	});

	it('should apply defaultProps to class components', () => {
		class Test extends Component {
			render(props) {
				return <div {...props} />;
			}
		}
		Test.defaultProps = {
			foo: 'default foo',
			bar: 'default bar'
		};

		expect(render(<Test />), 'defaults').to.equal(
			'<div foo="default foo" bar="default bar"></div>'
		);
		expect(render(<Test bar="b" />), 'partial').to.equal(
			'<div bar="b" foo="default foo"></div>'
		);
		expect(render(<Test foo="a" bar="b" />), 'overridden').to.equal(
			'<div foo="a" bar="b"></div>'
		);
		expect(render(<Test foo={undefined} bar="b" />), 'overridden').to.equal(
			'<div foo="default foo" bar="b"></div>'
		);
	});

	it('should apply defaultProps to functional components', () => {
		const Test = (props) => <div {...props} />;
		Test.defaultProps = {
			foo: 'default foo',
			bar: 'default bar'
		};

		expect(render(<Test />), 'defaults').to.equal(
			'<div foo="default foo" bar="default bar"></div>'
		);
		expect(render(<Test bar="b" />), 'partial').to.equal(
			'<div bar="b" foo="default foo"></div>'
		);
		expect(render(<Test foo="a" bar="b" />), 'overridden').to.equal(
			'<div foo="a" bar="b"></div>'
		);
		expect(render(<Test foo={undefined} bar="b" />), 'overridden').to.equal(
			'<div foo="default foo" bar="b"></div>'
		);
	});

	it("should expose the provider map as the component's _globalContext", () => {
		const Ctx = createContext('default');
		let globalContext;
		function Foo() {
			globalContext = this.__n;
			return null;
		}

		render(
			<Ctx.Provider value="provided">
				<Foo />
			</Ctx.Provider>
		);

		expect(globalContext[Ctx.__c].props.value).to.equal('provided');
	});

	it("should expose the provider map as a class component's _globalContext", () => {
		const Ctx = createContext('default');
		let globalContext;
		class Foo extends Component {
			render() {
				globalContext = this.__n;
				return null;
			}
		}

		render(
			<Ctx.Provider value="provided">
				<Foo />
			</Ctx.Provider>
		);

		expect(globalContext[Ctx.__c].props.value).to.equal('provided');
	});

	// `use` is exported by preact/compat from Preact 11
	it.skipIf(!compat.use)(
		'should resolve use(Context) to the nearest provider',
		() => {
			const Ctx = createContext('default');
			function Foo() {
				return <span>{compat.use(Ctx)}</span>;
			}

			expect(render(<Foo />)).to.equal('<span>default</span>');
			expect(
				render(
					<Ctx.Provider value="provided">
						<Foo />
					</Ctx.Provider>
				)
			).to.equal('<span>provided</span>');
		}
	);
});
