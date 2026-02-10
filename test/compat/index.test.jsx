import render from '../../src/index.js';
import { createElement as h, Component, createPortal } from 'preact/compat';
import { expect, describe, it } from 'vitest';

describe('compat', () => {
	describe('createPortal', () => {
		it('should render portal children inline', () => {
			const container = { nodeType: 1 };
			const rendered = render(
				<div>
					<span>before</span>
					{createPortal(<div class="portal-content">portaled</div>, container)}
					<span>after</span>
				</div>
			);
			expect(rendered).to.equal(
				'<div><span>before</span><div class="portal-content"></div><span>after</span></div>'
			);
		});

		it('should render nested portals', () => {
			const container1 = { nodeType: 1 };
			const container2 = { nodeType: 1 };
			const rendered = render(
				<div>
					{createPortal(
						<div class="outer">
							{createPortal(<div class="inner">nested</div>, container2)}
						</div>,
						container1
					)}
				</div>
			);
			expect(rendered).to.equal(
				'<div><div class="outer"><div class="inner">nested</div></div></div>'
			);
		});

		it('should render portal with multiple children', () => {
			const container = { nodeType: 1 };
			const rendered = render(
				<div>
					{createPortal(
						[<span key="a">first</span>, <span key="b">second</span>],
						container
					)}
				</div>
			);
			expect(rendered).to.equal('<div></div>');
		});

		it('should render portal with text content', () => {
			const container = { nodeType: 1 };
			const rendered = render(
				<div>{createPortal('just text', container)}</div>
			);
			expect(rendered).to.equal('<div></div>');
		});

		it('should render portal with component children', () => {
			const container = { nodeType: 1 };
			function Inner() {
				return <em>component inside portal</em>;
			}
			const rendered = render(<div>{createPortal(<Inner />, container)}</div>);
			expect(rendered).to.equal('<div></div>');
		});
	});

	it('should not duplicate class attribute when className is empty', async () => {
		let rendered = render(h('div', { className: '' }));
		let expected = `<div></div>`;

		expect(rendered).to.equal(expected);
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
});
