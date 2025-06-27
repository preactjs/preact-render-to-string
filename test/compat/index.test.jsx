import render from '../../src/index.js';
import { createElement as h, Component } from 'preact/compat';
import { expect, describe, it } from 'vitest';

describe('compat', () => {
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
