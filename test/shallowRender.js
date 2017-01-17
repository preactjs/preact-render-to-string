import { shallowRender } from '../src';
import { h, Component } from 'preact';
import chai, { expect } from 'chai';
import { spy, match, useFakeTimers } from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

describe('shallowRender()', () => {
	it('should not render nested components', () => {
		let Test = spy( ({ foo, children }) => <div bar={foo}><b>test child</b>{ children }</div> );
		Test.displayName = 'Test';

		let rendered = shallowRender(
			<section>
				<Test foo={1}><span>asdf</span></Test>
			</section>
		);

		expect(rendered).to.equal(`<section><Test foo="1"><span>asdf</span></Test></section>`);
		expect(Test).not.to.have.been.called;
	});

	it('should always render root component', () => {
		let Test = spy( ({ foo, children }) => <div bar={foo}><b>test child</b>{ children }</div> );
		Test.displayName = 'Test';

		let rendered = shallowRender(
			<Test foo={1}>
				<span>asdf</span>
			</Test>
		);

		expect(rendered).to.equal(`<div bar="1"><b>test child</b><span>asdf</span></div>`);
		expect(Test).to.have.been.calledOnce;
	});

	it(`should render all truthy child component attributes and allowed falsey attributes`, () => {
		let Outer = ({ foo, children }) => (<div>{ children }</div>) ;

		let date = new Date();
		let expectedPresent = {
			str: 'test',
			obj: {a: 'b'},
			arr: ['a'],
			func: ()=>{let a=10;},
			boolT: true,
			numNeg: -1,
			numPos: 1,
			sym: Symbol('foo'),
			date,
			math: Math.PI,
			regx: new RegExp("ab+c"),
			// falsey but expected
			strEmp: '',
			numZer: 0
		};
		let expectedAbsent = {
			boolF: false,
			nan: NaN,
			nul: null,
			und: undefined
		};
		let props = { ...expectedPresent, ...expectedAbsent};
		let Inner = () => {};

		let rendered = shallowRender(
			<Outer>
				<Inner { ...props } />
			</Outer>
		);

		expect(rendered).to.equal(`<div><Inner str="test" obj=[object Object] arr=[object Array] func=[object Function] boolT numNeg="-1" numPos="1" sym="Symbol(foo)" date=[object Date] math="3.141592653589793" regx=[object RegExp] strEmp numZer="0"></Inner></div>`);
	});

	it(`should render all non-primative child component attributes deeply when 'detailedProps' option is present`, () => {
		let Outer = ({ foo, children }) => <div>{ children }</div> ;

		let clock = useFakeTimers(Date.UTC(2017,1,1,1,1,1,1));
		let props = {
			obj: {a: 'b'},
			arr: ['a'],
			func: ()=>{let a=10;},
			sym: Symbol('foo'),
			date: new Date(),
			math: Math.PI,
			regx: /a+b+c/
		};
		let Inner = () => {};

		let rendered = shallowRender(
			<Outer>
				<Inner { ...props } />
			</Outer>
		, null, {detailedProps: true});

		clock.restore();

		expect(rendered).to.equal(`<div><Inner obj={"a":"b"} arr=["a"] func=function () { var a = 10; } sym="Symbol(foo)" date="2017-02-01T01:01:01.001Z" math="3.141592653589793" regx={}></Inner></div>`);
	});
});
