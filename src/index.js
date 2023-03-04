import { encodeEntities, styleObjToCss, UNSAFE_NAME, XLINK } from './util';
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
} from './constants';

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
export default function renderToString(vnode, context) {
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
		return _renderToStringStackIterator(vnode, context || EMPTY_OBJ, parent);
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

	let c = new type(vnode.props, context);

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
	} else if (c.componentWillMount) {
		c.componentWillMount();

		// If the user called setState in cWM we need to flush pending,
		// state updates. This is the same behaviour in React.
		c.state = c[NEXT_STATE] !== c.state ? c[NEXT_STATE] : c.state;
	}

	if (renderHook) renderHook(vnode);

	return c.render(c.props, c.state, context);
}

const FRAGMENT_TYPE = 0;
const LIST_TYPE = 1;
const CLASS_COMPONENT_TYPE = 2;
const FN_COMPONENT_TYPE = 3;
const DOM_NODE_TYPE = 4;
const TEXT_NODE_TYPE = 5;
const NULL_NODE_TYPE = 6;
const FAUX_NODE_TYPE = 7;

function getStep(vnode) {
	if (vnode == null || vnode === true || vnode === false || vnode === '') {
		return NULL_NODE_TYPE;
	} else if (typeof vnode != 'object') {
		return TEXT_NODE_TYPE;
	} else if (isArray(vnode)) {
		return LIST_TYPE;
	} else if (vnode.constructor !== undefined) {
		return FAUX_NODE_TYPE;
	} else if (vnode.type === Fragment) {
		return FRAGMENT_TYPE;
	} else if (
		typeof vnode.type == 'function' &&
		vnode.type.prototype &&
		typeof vnode.type.prototype.render === 'function'
	) {
		return CLASS_COMPONENT_TYPE;
	} else if (typeof vnode.type == 'function') {
		return FN_COMPONENT_TYPE;
	}

	return DOM_NODE_TYPE;
}

function normalizeTopLevelFragment(rendered) {
	const isTopLevelFragment =
		rendered != null && rendered.type === Fragment && rendered.key == null;
	return isTopLevelFragment ? rendered.props.children : rendered;
}

function _renderToStringStackIterator(
	initialVNode,
	initialContext,
	initialParent
) {
	// the itemized shape allows us to hold a vnode, the context up to that point and
	// a backref to the parent vnode.
	const data = [
		{
			node: initialVNode,
			context: initialContext,
			parent: initialParent,
			isSvgMode: false,
			selectValue: undefined
		}
	];
	// [0] is the array we are currently handling.
	// [1] is the pointer for the item in the array we are handling.
	let current = [data, 0];
	// our stack contains the history of what we are handling and have
	// handled while we do a depth-first traversal of the vnode-tree.
	const stack = [current];
	// The stringified output for the depth-first traversal of our vnode-tree
	let output = '';

	while (stack.length) {
		// When we see that the length of our children got exceeded
		// we know that we can go back up a level.
		// we can use this to close dom-tags
		if (current[1] >= current[0].length) {
			const lastItem = current[0][current[1] - 1];

			if (
				!Array.isArray(lastItem.node) &&
				typeof lastItem.parent.type === 'string'
			) {
				output += '</' + lastItem.parent.type + '>';
			}
			// TODO: this is currently bugged we have to look for the closest dom-parent and close that
			// TODO: invoke options.unmount and afterDIff

			stack.pop();
			current = stack[stack.length - 1];
			continue;
		}

		const item = current[0][current[1]];
		const { node, parent } = item;
		let { context, selectValue, isSvgMode } = item;

		switch (getStep(node)) {
			// Cases that result in null
			case NULL_NODE_TYPE:
			case FAUX_NODE_TYPE: {
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}
			// TODO: set CHILDREN and PARENT for every step here

			// We discover a new array, we have to gather all children
			// in a shape that allows us to handle them within our iteration.
			// this means that we will convert them to our item shape and
			// add them to our stack as data-points.
			case LIST_TYPE: {
				const data = [];
				for (let i = 0; i < node.length; i++) {
					let child = node[i];
					data.push({
						node: child,
						context,
						parent,
						isSvgMode,
						selectValue
					});
				}
				stack.push([data, 0]);
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}

			// FN-types, these produce more children
			// Similar to a list-type but with extra steps.

			// TODO: invoke options before diff for every step underneath
			case FRAGMENT_TYPE: {
				const rendered = normalizeTopLevelFragment(node.props.children);
				const data = [
					{
						node: rendered,
						context,
						parent: node,
						isSvgMode,
						selectValue
					}
				];
				stack.push([data, 0]);
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}
			case CLASS_COMPONENT_TYPE: {
				let contextType = node.type.contextType,
					cctx = context;
				if (contextType != null) {
					let provider = context[contextType.__c];
					cctx = provider ? provider.props.value : contextType.__;
				}

				const rendered = normalizeTopLevelFragment(
					/**#__NOINLINE__**/ renderClassComponent(node, cctx)
				);
				const component = node[COMPONENT];

				if (component.getChildContext != null) {
					context = assign({}, context, component.getChildContext());
				}

				const data = [
					{
						node: rendered,
						context,
						parent: node,
						isSvgMode,
						selectValue
					}
				];
				stack.push([data, 0]);
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}
			case FN_COMPONENT_TYPE: {
				let contextType = node.type.contextType,
					cctx = context;
				if (contextType != null) {
					let provider = context[contextType.__c];
					cctx = provider ? provider.props.value : contextType.__;
				}

				const component = {
					__v: node,
					props: node.props,
					context: cctx,
					// silently drop state updates
					setState: markAsDirty,
					forceUpdate: markAsDirty,
					__d: true,
					// hooks
					__h: []
				};
				node[COMPONENT] = component;

				let count = 0,
					rendered;
				while (component[DIRTY] && count++ < 25) {
					component[DIRTY] = false;

					if (renderHook) renderHook(node);

					rendered = node.type.call(component, node.props, cctx);
				}
				component[DIRTY] = true;

				if (component.getChildContext != null) {
					context = assign({}, context, component.getChildContext());
				}

				rendered = normalizeTopLevelFragment(rendered);

				const data = [
					{
						node: rendered,
						context,
						parent: node,
						isSvgMode,
						selectValue
					}
				];
				stack.push([data, 0]);
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}

			// DOM TYPES, these produce output
			case TEXT_NODE_TYPE: {
				if (typeof node === 'function') {
					current[1]++;
					current = stack[stack.length - 1];
					continue;
				}
				output += encodeEntities(node + '');
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}
			case DOM_NODE_TYPE: {
				const { props, type } = node;
				let children,
					html = '',
					s = '<' + type;
				node[PARENT] = parent;

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

						default: {
							if (isSvgMode && XLINK.test(name)) {
								name = name
									.toLowerCase()
									.replace(XLINK_REPLACE_REGEX, 'xlink:');
							} else if (UNSAFE_NAME.test(name)) {
								continue;
							} else if (name[0] === 'a' && name[1] === 'r' && v != null) {
								// serialize boolean aria-xyz attribute values as strings
								v += '';
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
					throw new Error(`${type} is not a valid HTML tag name in ${s}>`);
				}

				if (html) {
					// dangerouslySetInnerHTML defined this node's contents
					current[1]++;
					current = stack[stack.length - 1];
				} else if (typeof children === 'string') {
					// single text child
					const data = [
						{
							node: children,
							context,
							parent: node,
							isSvgMode,
							selectValue
						}
					];
					stack.push([data, 0]);
					current[1]++;
					current = stack[stack.length - 1];
				} else if (
					children != null &&
					children !== false &&
					children !== true
				) {
					const data = [
						{
							node: children,
							context,
							parent: node
						}
					];
					stack.push([data, 0]);
					current[1]++;
					current = stack[stack.length - 1];
				} else {
					current[1]++;
					current = stack[stack.length - 1];
				}

				if (!html && SELF_CLOSING.has(type)) {
					output += s + ' />';
					current[1]++;
					current = stack[stack.length - 1];
				} else if (html) {
					output += s + '>' + html + '</' + type + '>';
				} else {
					output += s + '>';
				}

				continue;
			}
			default: {
				current[1]++;
				current = stack[stack.length - 1];
				continue;
			}
		}
	}

	return output;
}

const XLINK_REPLACE_REGEX = /^xlink:?/;
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
