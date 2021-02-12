import { encodeEntities, styleObjToCss, assign, getChildren } from './util';
import { options, Fragment } from 'preact';

const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

const UNSAFE_NAME = /[\s\n\\/='"\0<>]/;

function noop() {}

/**
 * Current output buffer
 * @type {string[]}
 * */
let s = [];

/**
 * Current text encoding cache
 * @type {Map<string, string>}
 */
let cache = {};

/**
 * Current attribute encoding cache
 * @type {Map<string, string>}
 */
let attrCache = {};

/**
 * Current rendering options
 * @type {{ pretty, shallow, shallowHighOrder, renderRootComponent, sortAttributes, allAttributes, attributeHook, xml, voidElements }}
 */
let opts = {};

/**
 * Render Preact JSX + Components to an HTML string.
 * @param {import('preact').VNode} vnode	A Virtual DOM element to render.
 * @param {object} context Initial context for the root node
 */
export default function (vnode, _opts) {
	let oldS = s;
	let oldOpts = opts;
	opts = _opts || {};
	s = [];
	try {
		renderVNode(vnode, {}, null, false);
		return s.join('');
	} finally {
		cache = {};
		attrCache = {};
		s = oldS;
		opts = oldOpts;
	}
}

/**
 * Render a Virtual DOM element (of any kind) to HTML.
 * @param {import('preact').VNode|string|number|Array<import('preact').VNode|string|number>} any renderable value
 * @param {object} context (forks throughout the tree)
 * @param {any} selectValue the current select value, passed down through the tree to set <options selected>
 * @param {boolean} isSvgMode are we rendering within an SVG?
 */
function renderVNode(vnode, context, selectValue, isSvgMode) {
	if (vnode == null || typeof vnode === 'boolean') {
		return;
	}

	// wrap array nodes in Fragment
	if (typeof vnode === 'object') {
		if (Array.isArray(vnode)) {
			let children = [];
			getChildren(children, vnode);
			for (let i = 0; i < children.length; i++) {
				renderVNode(children[i], context, selectValue, isSvgMode);
			}
			return;
		}
	} else {
		s.push(cache[vnode] || (cache[vnode] = encodeEntities(vnode)));
		return;
	}

	let nodeName = vnode.type,
		props = vnode.props,
		isComponent = false;

	context = context || {};

	// components
	if (typeof nodeName === 'function') {
		if (nodeName === Fragment) {
			renderVNode(vnode.props.children, context, selectValue, isSvgMode);
			return;
		}

		isComponent = true;
		// if (nodeName===Fragment) {
		// 	let rendered = '';
		// 	let children = [];
		// 	getChildren(children, vnode.props.children);
		// 	for (let i = 0; i < children.length; i++) {
		// 		rendered += renderToString(children[i], context, selectValue);
		// 	}
		// 	return rendered;
		// }

		let rendered;

		let c = (vnode.__c = {
			__v: vnode,
			context,
			props: vnode.props,
			// silently drop state updates
			setState: noop,
			forceUpdate: noop,
			// hooks
			__h: []
		});

		// options._diff
		if (options.__b) options.__b(vnode);

		// options.render
		if (options.__r) options.__r(vnode);

		if (!('prototype' in nodeName) || !('render' in nodeName.prototype)) {
			// Necessary for createContext api. Setting this property will pass
			// the context value as `this.context` just for this component.
			let cxType = nodeName.contextType;
			let provider = cxType && context[cxType.__c];
			let cctx =
				cxType != null
					? provider
						? provider.props.value
						: cxType.__
					: context;

			// stateless functional components
			rendered = nodeName.call(c, props, cctx);
		} else {
			// class-based components
			let cxType = nodeName.contextType;
			let provider = cxType && context[cxType.__c];
			let cctx =
				cxType != null
					? provider
						? provider.props.value
						: cxType.__
					: context;

			c = vnode.__c = new nodeName(props, cctx);
			c.__v = vnode;
			// turn off stateful re-rendering:
			c._dirty = c.__d = true;
			c.props = props;
			if (c.state == null) c.state = {};

			if (c._nextState == null && c.__s == null) {
				c._nextState = c.__s = c.state;
			}

			c.context = cctx;
			if ('getDerivedStateFromProps' in nodeName) {
				c.state = assign(
					assign({}, c.state),
					nodeName.getDerivedStateFromProps(c.props, c.state)
				);
			} else if ('componentWillMount' in c) {
				c.componentWillMount();
			}

			// If the user called setState in cWM we need to flush pending,
			// state updates. This is the same behaviour in React.
			c.state =
				c._nextState !== c.state
					? c._nextState
					: c.__s !== c.state
					? c.__s
					: c.state;

			rendered = c.render(c.props, c.state, c.context);
		}

		if ('getChildContext' in c) {
			context = assign(assign({}, context), c.getChildContext());
		}

		if (options.diffed) options.diffed(vnode);

		renderVNode(rendered, context, selectValue, isSvgMode);
		return;
	}

	/*
	if (UNSAFE_NAME.test(nodeName)) return;

	let s = '<';
	// p.s += '<';
	// p.s += nodeName;
	let html;
	s += nodeName;

	if (props) {
		if (nodeName === 'option' && selectValue === props.value) {
			// p.s += ' selected';
			s += ' selected';
		}

		for (let name in props) {
			let v = props[name];
			let type;
			if (
				name === 'children' ||
				name === 'key' ||
				name === 'ref' ||
				UNSAFE_NAME.test(name)
			) {
				// skip
			} else if (nodeName === 'select' && name === 'value') {
				selectValue = v;
			} else if (name === 'dangerouslySetInnerHTML') {
				html = v && v.__html;
			} else if ((v || v === 0) && (type = typeof v) !== 'function') {
				if (name === 'style' && type === 'object') {
					v = styleObjToCss(v);
				} else if (name.substring(0, 5) === 'xlink') {
					// this doesn't actually need to be limited to SVG, since attributes "xlinkHref" are invalid anyway
					name = name.replace(/^xlink([A-Z])/, 'xlink:$1');
				}
				s += ' ';
				s += name;
				if (v !== true && v !== '') {
					s += '="';
					s += encodeEntities(v);
					s += '"';
				}
			}
		}
	}

	let isVoid = VOID_ELEMENTS.test(nodeName);
	if (isVoid) {
		s += ' />';
	} else {
		s += '>';
	}

	if (html) {
		s += html;
	} else if (props && props.children) {
		renderVNode(props.children, context, selectValue, p);
	}

	if (!isVoid) {
		s += '</';
		s += nodeName;
		s += '>';
	}
	*/

	if (UNSAFE_NAME.test(nodeName))
		throw new Error(`${nodeName} is not a valid HTML tag name in ${s}`);

	let buf = '<' + nodeName;

	// render JSX to HTML
	let propChildren, html;

	if (props) {
		let attrs = Object.keys(props);

		// allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
		if (opts.sortAttributes === true) attrs.sort();

		for (let i = 0; i < attrs.length; i++) {
			let name = attrs[i],
				v = props[name];
			if (name === 'children') {
				propChildren = v;
				continue;
			}

			if (UNSAFE_NAME.test(name)) continue;

			if (
				!opts.allAttributes &&
				(name === 'key' ||
					name === 'ref' ||
					name === '__self' ||
					name === '__source' ||
					name === 'defaultValue')
			)
				continue;

			if (name === 'className') {
				if (props.class) continue;
				name = 'class';
			} else if (isSvgMode && name.indexOf('xlinkH') === 0) {
				name = name.replace('H', ':h').toLowerCase();
			}

			if (name === 'htmlFor') {
				if (props.for) continue;
				name = 'for';
			}

			if (name === 'style' && v && typeof v === 'object') {
				v = styleObjToCss(v);
			}

			// always use string values instead of booleans for aria attributes
			// also see https://github.com/preactjs/preact/pull/2347/files
			if (name[0] === 'a' && name['1'] === 'r' && typeof v === 'boolean') {
				v = String(v);
			}

			let hooked =
				opts.attributeHook &&
				opts.attributeHook(name, v, context, opts, isComponent);
			if (hooked || hooked === '') {
				buf = buf + hooked;
				continue;
			}

			if (name === 'dangerouslySetInnerHTML') {
				html = v && v.__html;
			} else if (nodeName === 'textarea' && name === 'value') {
				// <textarea value="a&b"> --> <textarea>a&amp;b</textarea>
				propChildren = v;
			} else if ((v || v === 0 || v === '') && typeof v !== 'function') {
				if (v === true || v === '') {
					v = name;
					// in non-xml mode, allow boolean attributes
					if (!opts || !opts.xml) {
						buf = buf + ' ' + name;
						continue;
					}
				}

				if (name === 'value') {
					if (nodeName === 'select') {
						selectValue = v;
						continue;
					} else if (nodeName === 'option' && selectValue == v) {
						buf = buf + ' selected';
					}
				}
				buf =
					buf +
					' ' +
					name +
					'="' +
					(attrCache[v] || (attrCache[v] = encodeEntities(v))) +
					'"';
			}
		}
	}

	// s += '>';

	let isVoid =
		String(nodeName).match(VOID_ELEMENTS) ||
		(opts.voidElements && String(nodeName).match(opts.voidElements));

	let children;
	if (isVoid) {
		s.push(buf + ' />');
	} else {
		s.push(buf + '>');
		if (html) {
			s.push(html);
		} else if (
			propChildren != null &&
			getChildren((children = []), propChildren).length
		) {
			for (let i = 0; i < children.length; i++) {
				let child = children[i];

				if (child != null && child !== false) {
					renderVNode(
						child,
						context,
						selectValue,
						nodeName === 'svg' || (nodeName !== 'foreignObject' && isSvgMode)
					);
				}
			}
		}
		s.push(`</${nodeName}>`);
	}
}
