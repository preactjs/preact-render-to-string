import {
	encodeEntities,
	styleObjToCss,
	getChildren,
	getContext,
	createComponent,
	UNSAFE_NAME,
	XLINK,
	VOID_ELEMENTS
} from './util';
import { options, Fragment } from 'preact';
import { _renderToStringPretty } from './pretty';

/** @typedef {import('preact').VNode} VNode */

const SHALLOW = { shallow: true };

/** Render Preact JSX + Components to an HTML string.
 *	@name render
 *	@function
 *	@param {VNode} vnode	JSX VNode to render.
 *	@param {Object} [context={}]	Optionally pass an initial context object through the render path.
 *	@param {Object} [options={}]	Rendering options
 *	@param {Boolean} [options.shallow=false]	If `true`, renders nested Components as HTML elements (`<Foo a="b" />`).
 *	@param {Boolean} [options.xml=false]		If `true`, uses self-closing tags for elements without children.
 *	@param {Boolean} [options.pretty=false]		If `true`, adds whitespace for readability
 *	@param {RegExp|undefined} [options.voidElements]       RegeEx that matches elements that are considered void (self-closing)
 */
renderToString.render = renderToString;

/** Only render elements, leaving Components inline as `<ComponentName ... />`.
 *	This method is just a convenience alias for `render(vnode, context, { shallow:true })`
 *	@name shallow
 *	@function
 *	@param {VNode} vnode	JSX VNode to render.
 *	@param {Object} [context={}]	Optionally pass an initial context object through the render path.
 */
let shallowRender = (vnode, context) => renderToString(vnode, context, SHALLOW);

const EMPTY_ARR = [];
function renderToString(vnode, context, opts) {
	context = context || {};
	opts = Object.assign(opts || {}, {
		diff: options.__b,
		render: options.__r,
		diffed: options.diffed
	});

	// Performance optimization: `renderToString` is synchronous and we
	// therefore don't execute any effects. To do that we pass an empty
	// array to `options._commit` (`__c`). But we can go one step further
	// and avoid a lot of dirty checks and allocations by setting
	// `options._skipEffects` (`__s`) too.
	const previousSkipEffects = options.__s;
	options.__s = true;

	let res;
	if (
		opts.pretty ||
		opts.sortAttributes ||
		opts.shallow ||
		opts.allAttributes ||
		opts.xml ||
		opts.attributeHook
	) {
		res = _renderToStringPretty(vnode, context, opts);
	} else {
		res = _renderToString(vnode, context, opts, false, undefined);
	}

	// options._commit, we don't schedule any effects in this library right now,
	// so we can pass an empty queue to this hook.
	if (options.__c) options.__c(vnode, EMPTY_ARR);
	EMPTY_ARR.length = 0;
	options.__s = previousSkipEffects;
	return res;
}

function renderFragment(vnode, context, opts, isSvgMode, selectValue) {
	return _renderToString(
		vnode.props.children,
		context,
		opts,
		isSvgMode,
		selectValue
	);
}

function renderFunctionComponent(vnode, context, opts) {
	let rendered,
		c = (vnode.__c = createComponent(vnode, context)),
		cctx = getContext(vnode.type, context);

	// If a hook invokes setState() to invalidate the component during rendering,
	// re-render it up to 25 times to allow "settling" of memoized states.
	// Note:
	//   This will need to be updated for Preact 11 to use internal.flags rather than component._dirty:
	//   https://github.com/preactjs/preact/blob/d4ca6fdb19bc715e49fd144e69f7296b2f4daa40/src/diff/component.js#L35-L44
	let count = 0;
	while (c.__d && count++ < 25) {
		c.__d = false;

		if (opts.render) opts.render(vnode);

		// stateless functional components
		rendered = vnode.type.call(vnode.__c, vnode.props, cctx);
	}

	return rendered;
}

function renderClassComponent(vnode, context, opts) {
	let nodeName = vnode.type,
		cctx = getContext(nodeName, context);

	// c = new nodeName(props, context);
	let c = (vnode.__c = new nodeName(vnode.props, cctx));
	c.__v = vnode;
	// turn off stateful re-rendering:
	c._dirty = c.__d = true;
	c.props = vnode.props;
	if (isNull(c.state)) c.state = {};

	if (isNull(c._nextState) && isNull(c.__s)) {
		c._nextState = c.__s = c.state;
	}

	c.context = cctx;
	if (nodeName.getDerivedStateFromProps)
		c.state = Object.assign(
			{},
			c.state,
			nodeName.getDerivedStateFromProps(c.props, c.state)
		);
	else if (c.componentWillMount) {
		c.componentWillMount();

		// If the user called setState in cWM we need to flush pending,
		// state updates. This is the same behaviour in React.
		c.state =
			c._nextState !== c.state
				? c._nextState
				: c.__s !== c.state
				? c.__s
				: c.state;
	}

	if (opts.render) opts.render(vnode);

	return c.render(c.props, c.state, c.context);
}

function normalizePropName(name, isSvgMode) {
	if (name === 'className') {
		return 'class';
	} else if (name === 'htmlFor') {
		return 'for';
	} else if (name === 'defaultValue') {
		return 'value';
	} else if (name === 'defaultChecked') {
		return 'checked';
	} else if (name === 'defaultSelected') {
		return 'selected';
	} else if (isSvgMode && XLINK.test(name)) {
		return name.toLowerCase().replace(/^xlink:?/, 'xlink:');
	}

	return name;
}

function normalizePropValue(name, v) {
	if (name === 'style' && !isNull(v) && isObject(v)) {
		return styleObjToCss(v);
	} else if (name[0] === 'a' && name[1] === 'r' && isBoolean(v)) {
		// always use string values instead of booleans for aria attributes
		// also see https://github.com/preactjs/preact/pull/2347/files
		return String(v);
	}

	return v;
}

const isUndefined = (x) => typeof x == 'undefined';
const isFunction = (x) => typeof x == 'function';
const isBoolean = (x) => typeof x == 'boolean';
const isObject = (x) => typeof x == 'object';
const isNull = (x) => x == null;
const isArray = Array.isArray;

/** The default export is an alias of `render()`. */
function _renderToString(vnode, context, opts, isSvgMode, selectValue) {
	if (isNull(vnode) || isBoolean(vnode)) {
		return '';
	}

	// #text nodes
	if (!isObject(vnode)) {
		return encodeEntities(vnode);
	}

	if (isArray(vnode)) {
		return vnode
			.map((node) =>
				_renderToString(node, context, opts, isSvgMode, selectValue)
			)
			.join('');
	}

	let nodeName = vnode.type,
		props = vnode.props;
	const isComponent = isFunction(nodeName);

	// components
	if (isComponent) {
		if (nodeName === Fragment) {
			return renderFragment(vnode, context, opts, isSvgMode, selectValue);
		}

		let rendered;

		if (opts.diff) opts.diff(vnode);

		if (!nodeName.prototype || !isFunction(nodeName.prototype.render)) {
			rendered = renderFunctionComponent(vnode, context, opts);
		} else {
			rendered = renderClassComponent(vnode, context, opts);
		}

		if (vnode.__c.getChildContext) {
			context = Object.assign({}, context, vnode.__c.getChildContext());
		}

		if (opts.diffed) opts.diffed(vnode);

		return _renderToString(rendered, context, opts, isSvgMode, selectValue);
	}

	// render JSX to HTML
	let s = '<' + nodeName,
		propChildren,
		html;

	if (props) {
		propChildren = props.children;
		for (let name in props) {
			let v = props[name];

			if (UNSAFE_NAME.test(name)) continue;

			if (
				name === 'key' ||
				name === 'ref' ||
				name === '__self' ||
				name === '__source' ||
				name === 'children' ||
				(name === 'className' && !isUndefined(props.class)) ||
				(name === 'htmlFor' && !isUndefined(props.for))
			) {
				continue;
			}

			name = normalizePropName(name, isSvgMode);
			v = normalizePropValue(name, v);

			if (name === 'dangerouslySetInnerHTML') {
				html = v && v.__html;
			} else if (nodeName === 'textarea' && name === 'value') {
				// <textarea value="a&b"> --> <textarea>a&amp;b</textarea>
				propChildren = v;
			} else if ((v || v === 0 || v === '') && !isFunction(v)) {
				if (v === true || v === '') {
					v = name;
					s = s + ' ' + name;
					continue;
				}

				if (name === 'value') {
					if (nodeName === 'select') {
						selectValue = v;
						continue;
					} else if (
						// If we're looking at an <option> and it's the currently selected one
						nodeName === 'option' &&
						selectValue == v &&
						// and the <option> doesn't already have a selected attribute on it
						isUndefined(props.selected)
					) {
						s = s + ' selected';
					}
				}
				s = s + ' ' + name + '="' + encodeEntities(v) + '"';
			}
		}
	}

	s = s + '>';

	if (UNSAFE_NAME.test(nodeName))
		throw new Error(`${nodeName} is not a valid HTML tag name in ${s}`);

	let isVoid =
		VOID_ELEMENTS.test(nodeName) ||
		(opts.voidElements && opts.voidElements.test(nodeName));
	let pieces = '';

	let children = [];
	if (html) {
		return s + html + '</' + nodeName + '>';
	} else if (
		!isNull(propChildren) &&
		getChildren(children, propChildren).length
	) {
		for (let i = 0; i < children.length; i++) {
			let child = children[i];

			if (child != null && child !== false) {
				let childSvgMode =
						nodeName === 'svg'
							? true
							: nodeName === 'foreignObject'
							? false
							: isSvgMode,
					ret = _renderToString(
						child,
						context,
						opts,
						childSvgMode,
						selectValue
					);

				// Skip if we received an empty string
				if (ret) {
					pieces = pieces + ret;
				}
			}
		}
	}

	if (pieces.length) {
		return s + pieces + '</' + nodeName + '>';
	} else if (isVoid) {
		return s.replace(/>$/, ' />');
	}

	return s + '</' + nodeName + '>';
}

/** The default export is an alias of `render()`. */

renderToString.shallowRender = shallowRender;

export default renderToString;

export {
	renderToString as render,
	renderToString as renderToStaticMarkup,
	renderToString,
	shallowRender
};
