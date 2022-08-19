import {
	encodeEntities,
	styleObjToCss,
	getContext,
	createComponent,
	UNSAFE_NAME,
	XLINK,
	VOID_ELEMENTS
} from './util';
import { options, Fragment } from 'preact';
import { _renderToStringPretty } from './pretty';
import {
	COMMIT,
	COMPONENT,
	DIFF,
	DIFFED,
	DIRTY,
	NEXT_STATE,
	RENDER,
	SKIP_EFFECTS,
	VNODE
} from './constants';

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

	// Performance optimization: `renderToString` is synchronous and we
	// therefore don't execute any effects. To do that we pass an empty
	// array to `options._commit` (`__c`). But we can go one step further
	// and avoid a lot of dirty checks and allocations by setting
	// `options._skipEffects` (`__s`) too.
	const previousSkipEffects = options[SKIP_EFFECTS];
	options[SKIP_EFFECTS] = true;

	let res;
	if (
		opts &&
		(opts.pretty ||
			opts.voidElements ||
			opts.sortAttributes ||
			opts.shallow ||
			opts.allAttributes ||
			opts.xml ||
			opts.attributeHook)
	) {
		res = _renderToStringPretty(vnode, context, opts);
	} else {
		res = _renderToString(vnode, context, false, undefined);
	}

	// options._commit, we don't schedule any effects in this library right now,
	// so we can pass an empty queue to this hook.
	if (options[COMMIT]) options[COMMIT](vnode, EMPTY_ARR);
	options[SKIP_EFFECTS] = previousSkipEffects;
	EMPTY_ARR.length = 0;
	return res;
}

function renderFunctionComponent(vnode, context) {
	let rendered,
		c = createComponent(vnode, context),
		cctx = getContext(vnode.type, context);

	vnode[COMPONENT] = c;

	// If a hook invokes setState() to invalidate the component during rendering,
	// re-render it up to 25 times to allow "settling" of memoized states.
	// Note:
	//   This will need to be updated for Preact 11 to use internal.flags rather than component._dirty:
	//   https://github.com/preactjs/preact/blob/d4ca6fdb19bc715e49fd144e69f7296b2f4daa40/src/diff/component.js#L35-L44
	let renderHook = options[RENDER];
	let count = 0;
	while (c[DIRTY] && count++ < 25) {
		c[DIRTY] = false;

		if (renderHook) renderHook(vnode);

		// stateless functional components
		rendered = vnode.type.call(c, vnode.props, cctx);
	}

	return rendered;
}

function renderClassComponent(vnode, context) {
	let nodeName = vnode.type,
		cctx = getContext(nodeName, context);

	// c = new nodeName(props, context);
	let c = new nodeName(vnode.props, cctx);
	vnode[COMPONENT] = c;
	c[VNODE] = vnode;
	// turn off stateful re-rendering:
	c[DIRTY] = true;
	c.props = vnode.props;
	if (c.state == null) c.state = {};

	if (c[NEXT_STATE] == null) {
		c[NEXT_STATE] = c.state;
	}

	c.context = cctx;
	if (nodeName.getDerivedStateFromProps) {
		c.state = assign(
			{},
			c.state,
			nodeName.getDerivedStateFromProps(c.props, c.state)
		);
	} else if (c.componentWillMount) {
		c.componentWillMount();

		// If the user called setState in cWM we need to flush pending,
		// state updates. This is the same behaviour in React.
		c.state = c[NEXT_STATE] !== c.state ? c[NEXT_STATE] : c.state;
	}

	let renderHook = options[RENDER];
	if (renderHook) renderHook(vnode);

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
	if (name === 'style' && v != null && typeof v === 'object') {
		return styleObjToCss(v);
	} else if (name[0] === 'a' && name[1] === 'r' && typeof v === 'boolean') {
		// always use string values instead of booleans for aria attributes
		// also see https://github.com/preactjs/preact/pull/2347/files
		return String(v);
	}

	return v;
}

const isArray = Array.isArray;
const assign = Object.assign;

/** The default export is an alias of `render()`. */
function _renderToString(vnode, context, isSvgMode, selectValue) {
	// Ignore non-rendered VNodes/values
	if (vnode == null || vnode === true || vnode === false || vnode === '') {
		return '';
	}

	// Text VNodes: escape as HTML
	if (typeof vnode !== 'object') {
		return encodeEntities(vnode);
	}

	// Recurse into children / Arrays
	if (isArray(vnode)) {
		let rendered = '';
		for (let i = 0; i < vnode.length; i++) {
			rendered =
				rendered + _renderToString(vnode[i], context, isSvgMode, selectValue);
		}
		return rendered;
	}

	if (options[DIFF]) options[DIFF](vnode);

	let type = vnode.type,
		props = vnode.props;

	// Invoke rendering on Components
	const isComponent = typeof type === 'function';
	if (isComponent) {
		if (type === Fragment) {
			return _renderToString(
				vnode.props.children,
				context,
				isSvgMode,
				selectValue
			);
		}

		let rendered;
		if (type.prototype && typeof type.prototype.render === 'function') {
			rendered = renderClassComponent(vnode, context);
		} else {
			rendered = renderFunctionComponent(vnode, context);
		}

		let component = vnode[COMPONENT];
		if (component.getChildContext) {
			context = assign({}, context, component.getChildContext());
		}

		// Recurse into children before invoking the after-diff hook
		const str = _renderToString(rendered, context, isSvgMode, selectValue);
		if (options[DIFFED]) options[DIFFED](vnode);
		return str;
	}

	// Serialize Element VNodes to HTML
	let s = '<',
		children,
		html;

	s = s + type;

	if (props) {
		children = props.children;
		for (let name in props) {
			let v = props[name];

			if (
				name === 'key' ||
				name === 'ref' ||
				name === '__self' ||
				name === '__source' ||
				name === 'children' ||
				(name === 'className' && 'class' in props) ||
				(name === 'htmlFor' && 'for' in props)
			) {
				continue;
			}

			if (UNSAFE_NAME.test(name)) continue;

			name = normalizePropName(name, isSvgMode);
			v = normalizePropValue(name, v);

			if (name === 'dangerouslySetInnerHTML') {
				html = v && v.__html;
			} else if (type === 'textarea' && name === 'value') {
				// <textarea value="a&b"> --> <textarea>a&amp;b</textarea>
				children = v;
			} else if ((v || v === 0 || v === '') && typeof v !== 'function') {
				if (v === true || v === '') {
					v = name;
					s = s + ' ' + name;
					continue;
				}

				if (name === 'value') {
					if (type === 'select') {
						selectValue = v;
						continue;
					} else if (
						// If we're looking at an <option> and it's the currently selected one
						type === 'option' &&
						selectValue == v &&
						// and the <option> doesn't already have a selected attribute on it
						!('selected' in props)
					) {
						s = s + ' selected';
					}
				}
				s = s + ' ' + name + '="' + encodeEntities(v) + '"';
			}
		}
	}

	let startElement = s;
	s = s + '>';

	if (UNSAFE_NAME.test(type)) {
		throw new Error(`${type} is not a valid HTML tag name in ${s}`);
	}

	let pieces = '';
	let hasChildren = false;

	if (html) {
		pieces = pieces + html;
		hasChildren = true;
	} else if (typeof children === 'string') {
		pieces = pieces + encodeEntities(children);
		hasChildren = true;
	} else if (isArray(children)) {
		for (let i = 0; i < children.length; i++) {
			let child = children[i];

			if (child != null && child !== false) {
				let childSvgMode =
					type === 'svg' || (type !== 'foreignObject' && isSvgMode);
				let ret = _renderToString(child, context, childSvgMode, selectValue);

				// Skip if we received an empty string
				if (ret) {
					pieces = pieces + ret;
					hasChildren = true;
				}
			}
		}
	} else if (children != null && children !== false && children !== true) {
		let childSvgMode =
			type === 'svg' || (type !== 'foreignObject' && isSvgMode);
		let ret = _renderToString(children, context, childSvgMode, selectValue);

		// Skip if we received an empty string
		if (ret) {
			pieces = pieces + ret;
			hasChildren = true;
		}
	}

	if (options[DIFFED]) options[DIFFED](vnode);

	if (hasChildren) {
		s = s + pieces;
	} else if (VOID_ELEMENTS.test(type)) {
		return startElement + ' />';
	}

	return s + '</' + type + '>';
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
