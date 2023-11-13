import {
	encodeEntities,
	styleObjToCss,
	UNSAFE_NAME,
	NAMESPACE_REPLACE_REGEX,
	HTML_LOWER_CASE,
	SVG_CAMEL_CASE
} from './util.js';
import { options, h, Fragment } from 'preact';
import {
	CHILDREN,
	COMMIT,
	COMPONENT,
	DIFF,
	DIFFED,
	DIRTY,
	NEXT_STATE,
	PARENT,
	RENDER,
	SKIP_EFFECTS,
	VNODE
} from './constants.js';

/** @typedef {import('preact').VNode} VNode */

const EMPTY_ARR = [];
const isArray = Array.isArray;
const assign = Object.assign;

// Global state for the current render pass
let beforeDiff, afterDiff, renderHook, ummountHook;

/**
 * Render Preact JSX + Components to an HTML string.
 * @param {VNode} vnode	JSX Element / VNode to render
 * @param {Object} [context={}] Initial root context object
 * @returns {string} serialized HTML
 */
export function renderToString(vnode, context) {
	// Performance optimization: `renderToString` is synchronous and we
	// therefore don't execute any effects. To do that we pass an empty
	// array to `options._commit` (`__c`). But we can go one step further
	// and avoid a lot of dirty checks and allocations by setting
	// `options._skipEffects` (`__s`) too.
	const previousSkipEffects = options[SKIP_EFFECTS];
	options[SKIP_EFFECTS] = true;

	// store options hooks once before each synchronous render call
	beforeDiff = options[DIFF];
	afterDiff = options[DIFFED];
	renderHook = options[RENDER];
	ummountHook = options.unmount;

	const parent = h(Fragment, null);
	parent[CHILDREN] = [vnode];

	try {
		return _renderToString(
			vnode,
			context || EMPTY_OBJ,
			false,
			undefined,
			parent
		);
	} finally {
		// options._commit, we don't schedule any effects in this library right now,
		// so we can pass an empty queue to this hook.
		if (options[COMMIT]) options[COMMIT](vnode, EMPTY_ARR);
		options[SKIP_EFFECTS] = previousSkipEffects;
		EMPTY_ARR.length = 0;
	}
}

// Installed as setState/forceUpdate for function components
function markAsDirty() {
	this.__d = true;
}

const EMPTY_OBJ = {};

/**
 * @param {VNode} vnode
 * @param {Record<string, unknown>} context
 */
function renderClassComponent(vnode, context) {
	let type = /** @type {import("preact").ComponentClass<typeof vnode.props>} */ (vnode.type);

	let isMounting = true;
	let c;
	if (vnode[COMPONENT]) {
		isMounting = false;
		c = vnode[COMPONENT];
		c.state = c[NEXT_STATE];
	} else {
		c = new type(vnode.props, context);
	}

	vnode[COMPONENT] = c;
	c[VNODE] = vnode;

	c.props = vnode.props;
	c.context = context;
	// turn off stateful re-rendering:
	c[DIRTY] = true;

	if (c.state == null) c.state = EMPTY_OBJ;

	if (c[NEXT_STATE] == null) {
		c[NEXT_STATE] = c.state;
	}

	if (type.getDerivedStateFromProps) {
		c.state = assign(
			{},
			c.state,
			type.getDerivedStateFromProps(c.props, c.state)
		);
	} else if (isMounting && c.componentWillMount) {
		c.componentWillMount();

		// If the user called setState in cWM we need to flush pending,
		// state updates. This is the same behaviour in React.
		c.state = c[NEXT_STATE] !== c.state ? c[NEXT_STATE] : c.state;
	} else if (!isMounting && c.componentWillUpdate) {
		c.componentWillUpdate();
	}

	if (renderHook) renderHook(vnode);

	return c.render(c.props, c.state, context);
}

/**
 * Recursively render VNodes to HTML.
 * @param {VNode|any} vnode
 * @param {any} context
 * @param {boolean} isSvgMode
 * @param {any} selectValue
 * @param {VNode} parent
 * @returns {string}
 */
function _renderToString(vnode, context, isSvgMode, selectValue, parent) {
	// Ignore non-rendered VNodes/values
	if (vnode == null || vnode === true || vnode === false || vnode === '') {
		return '';
	}

	// Text VNodes: escape as HTML
	if (typeof vnode !== 'object') {
		if (typeof vnode === 'function') return '';
		return encodeEntities(vnode + '');
	}

	// Recurse into children / Arrays
	if (isArray(vnode)) {
		let rendered = '';
		parent[CHILDREN] = vnode;
		for (let i = 0; i < vnode.length; i++) {
			let child = vnode[i];
			if (child == null || typeof child === 'boolean') continue;

			rendered =
				rendered +
				_renderToString(child, context, isSvgMode, selectValue, parent);
		}
		return rendered;
	}

	// VNodes have {constructor:undefined} to prevent JSON injection:
	if (vnode.constructor !== undefined) return '';

	vnode[PARENT] = parent;
	if (beforeDiff) beforeDiff(vnode);

	let type = vnode.type,
		props = vnode.props,
		cctx = context,
		contextType,
		rendered,
		component;

	// Invoke rendering on Components
	if (typeof type === 'function') {
		if (type === Fragment) {
			// Serialized precompiled JSX.
			if (props.tpl) {
				let out = '';
				for (let i = 0; i < props.tpl.length; i++) {
					out += props.tpl[i];

					if (props.exprs && i < props.exprs.length) {
						const value = props.exprs[i];
						if (value == null) continue;

						// Check if we're dealing with a vnode or an array of nodes
						if (
							typeof value === 'object' &&
							(value.constructor === undefined || isArray(value))
						) {
							out += _renderToString(
								value,
								context,
								isSvgMode,
								selectValue,
								vnode
							);
						} else {
							// Values are pre-escaped by the JSX transform
							out += value;
						}
					}
				}

				return out;
			} else if (props.UNSTABLE_comment) {
				// Fragments are the least used components of core that's why
				// branching here for comments has the least effect on perf.
				return '<!--' + encodeEntities(props.UNSTABLE_comment || '') + '-->';
			}

			rendered = props.children;
		} else {
			contextType = type.contextType;
			if (contextType != null) {
				let provider = context[contextType.__c];
				cctx = provider ? provider.props.value : contextType.__;
			}

			if (type.prototype && typeof type.prototype.render === 'function') {
				rendered = /**#__NOINLINE__**/ renderClassComponent(vnode, cctx);
				component = vnode[COMPONENT];
			} else {
				component = {
					__v: vnode,
					props,
					context: cctx,
					// silently drop state updates
					setState: markAsDirty,
					forceUpdate: markAsDirty,
					__d: true,
					// hooks
					__h: []
				};
				vnode[COMPONENT] = component;

				// If a hook invokes setState() to invalidate the component during rendering,
				// re-render it up to 25 times to allow "settling" of memoized states.
				// Note:
				//   This will need to be updated for Preact 11 to use internal.flags rather than component._dirty:
				//   https://github.com/preactjs/preact/blob/d4ca6fdb19bc715e49fd144e69f7296b2f4daa40/src/diff/component.js#L35-L44
				let count = 0;
				while (component[DIRTY] && count++ < 25) {
					component[DIRTY] = false;

					if (renderHook) renderHook(vnode);

					rendered = type.call(component, props, cctx);
				}
				component[DIRTY] = true;
			}

			if (component.getChildContext != null) {
				context = assign({}, context, component.getChildContext());
			}

			if (
				(type.getDerivedStateFromError || component.componentDidCatch) &&
				options.errorBoundaries
			) {
				let str = '';
				// When a component returns a Fragment node we flatten it in core, so we
				// need to mirror that logic here too
				let isTopLevelFragment =
					rendered != null &&
					rendered.type === Fragment &&
					rendered.key == null;
				rendered = isTopLevelFragment ? rendered.props.children : rendered;

				try {
					str = _renderToString(
						rendered,
						context,
						isSvgMode,
						selectValue,
						vnode
					);
					return str;
				} catch (err) {
					if (type.getDerivedStateFromError) {
						component[NEXT_STATE] = type.getDerivedStateFromError(err);
					}

					if (component.componentDidCatch) {
						component.componentDidCatch(err, {});
					}

					if (component[DIRTY]) {
						rendered = renderClassComponent(vnode, context);
						component = vnode[COMPONENT];

						if (component.getChildContext != null) {
							context = assign({}, context, component.getChildContext());
						}

						let isTopLevelFragment =
							rendered != null &&
							rendered.type === Fragment &&
							rendered.key == null;
						rendered = isTopLevelFragment ? rendered.props.children : rendered;

						str = _renderToString(
							rendered,
							context,
							isSvgMode,
							selectValue,
							vnode
						);
					}

					return str;
				} finally {
					if (afterDiff) afterDiff(vnode);
					vnode[PARENT] = undefined;

					if (ummountHook) ummountHook(vnode);
				}
			}
		}

		// When a component returns a Fragment node we flatten it in core, so we
		// need to mirror that logic here too
		let isTopLevelFragment =
			rendered != null && rendered.type === Fragment && rendered.key == null;
		rendered = isTopLevelFragment ? rendered.props.children : rendered;

		// Recurse into children before invoking the after-diff hook
		const str = _renderToString(
			rendered,
			context,
			isSvgMode,
			selectValue,
			vnode
		);
		if (afterDiff) afterDiff(vnode);
		vnode[PARENT] = undefined;

		if (ummountHook) ummountHook(vnode);

		return str;
	}

	// Serialize Element VNodes to HTML
	let s = '<' + type,
		html = '',
		children;

	for (let name in props) {
		let v = props[name];

		switch (name) {
			case 'children':
				children = v;
				continue;

			// VDOM-specific props
			case 'key':
			case 'ref':
			case '__self':
			case '__source':
				continue;

			// prefer for/class over htmlFor/className
			case 'htmlFor':
				if ('for' in props) continue;
				name = 'for';
				break;
			case 'className':
				if ('class' in props) continue;
				name = 'class';
				break;

			// Form element reflected properties
			case 'defaultChecked':
				name = 'checked';
				break;
			case 'defaultSelected':
				name = 'selected';
				break;

			// Special value attribute handling
			case 'defaultValue':
			case 'value':
				name = 'value';
				switch (type) {
					// <textarea value="a&b"> --> <textarea>a&amp;b</textarea>
					case 'textarea':
						children = v;
						continue;

					// <select value> is serialized as a selected attribute on the matching option child
					case 'select':
						selectValue = v;
						continue;

					// Add a selected attribute to <option> if its value matches the parent <select> value
					case 'option':
						if (selectValue == v && !('selected' in props)) {
							s = s + ' selected';
						}
						break;
				}
				break;

			case 'dangerouslySetInnerHTML':
				html = v && v.__html;
				continue;

			// serialize object styles to a CSS string
			case 'style':
				if (typeof v === 'object') {
					v = styleObjToCss(v);
				}
				break;
			case 'acceptCharset':
				name = 'accept-charset';
				break;
			case 'httpEquiv':
				name = 'http-equiv';
				break;

			default: {
				if (NAMESPACE_REPLACE_REGEX.test(name)) {
					name = name.replace(NAMESPACE_REPLACE_REGEX, '$1:$2').toLowerCase();
				} else if (UNSAFE_NAME.test(name)) {
					continue;
				} else if ((name[4] === '-' || name === 'draggable') && v != null) {
					// serialize boolean aria-xyz or draggable attribute values as strings
					// `draggable` is an enumerated attribute and not Boolean. A value of `true` or `false` is mandatory
					// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable
					v += '';
				} else if (isSvgMode) {
					if (SVG_CAMEL_CASE.test(name)) {
						name =
							name === 'panose1'
								? 'panose-1'
								: name.replace(/([A-Z])/g, '-$1').toLowerCase();
					}
				} else if (HTML_LOWER_CASE.test(name)) {
					name = name.toLowerCase();
				}
			}
		}

		// write this attribute to the buffer
		if (v != null && v !== false && typeof v !== 'function') {
			if (v === true || v === '') {
				s = s + ' ' + name;
			} else {
				s = s + ' ' + name + '="' + encodeEntities(v + '') + '"';
			}
		}
	}

	if (UNSAFE_NAME.test(type)) {
		// this seems to performs a lot better than throwing
		// return '<!-- -->';
		throw new Error(`${type} is not a valid HTML tag name in ${s}>`);
	}

	if (html) {
		// dangerouslySetInnerHTML defined this node's contents
	} else if (typeof children === 'string') {
		// single text child
		html = encodeEntities(children);
	} else if (children != null && children !== false && children !== true) {
		// recurse into this element VNode's children
		let childSvgMode =
			type === 'svg' || (type !== 'foreignObject' && isSvgMode);
		html = _renderToString(children, context, childSvgMode, selectValue, vnode);
	}

	if (afterDiff) afterDiff(vnode);
	vnode[PARENT] = undefined;
	if (ummountHook) ummountHook(vnode);

	// Emit self-closing tag for empty void elements:
	if (!html && SELF_CLOSING.has(type)) {
		return s + '/>';
	}

	return s + '>' + html + '</' + type + '>';
}

const SELF_CLOSING = new Set([
	'area',
	'base',
	'br',
	'col',
	'command',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);

export default renderToString;
export const render = renderToString;
export const renderToStaticMarkup = renderToString;
