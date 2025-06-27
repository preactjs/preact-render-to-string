import { shallowRender } from '../src/jsx.js';
import { h, Fragment } from 'preact';
import { vi, describe, it, expect } from 'vitest';

describe('shallowRender()', () => {
	it('should not render nested components', () => {
		let Test = vi.fn(({ foo, children }) => (
			<div bar={foo}>
				<b>test child</b>
				{children}
			</div>
		));
		Test.displayName = 'Test';

		let rendered = shallowRender(
			<section>
				<Test foo={1}>
					<span>asdf</span>
				</Test>
			</section>,
			null,
			{ pretty: false, jsx: false }
		);

		expect(rendered).to.equal(
			`<section><Test foo="1"><span>asdf</span></Test></section>`
		);
		expect(Test).not.toHaveBeenCalled();
	});

	it('should always render root component', () => {
		let Test = vi.fn(({ foo, children }) => (
			<div bar={foo}>
				<b>test child</b>
				{children}
			</div>
		));
		Test.displayName = 'Test';

		let rendered = shallowRender(
			<Test foo={1}>
				<span>asdf</span>
			</Test>,
			null,
			{ pretty: false, jsx: false }
		);

		expect(rendered).to.equal(
			`<div bar="1"><b>test child</b><span>asdf</span></div>`
		);
		expect(Test).toHaveBeenCalledTimes(1);
	});

	describe('should ignore Fragments', () => {
		it('passed directly', () => {
			let rendered = shallowRender(
				<Fragment>
					<div>foo</div>
				</Fragment>
			);
			expect(rendered).to.equal(`<div>foo</div>`);
		});

		it('passed from FC', () => {
			const Test = () => (
				<Fragment>
					<div>foo</div>
				</Fragment>
			);

			let rendered = shallowRender(<Test />);

			expect(rendered).to.equal(`<div>foo</div>`);
		});
	});
});
