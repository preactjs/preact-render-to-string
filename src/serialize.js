import { encodeEntities, styleObjToCss, assign, getChildren } from './util';
import { options, Fragment } from 'preact';

const EMPTY_ARR = [];

export function serialize(vnode, format) {
	// Performance optimization: `renderToString` is synchronous and we
	// therefore don't execute any effects. To do that we pass an empty
	// array to `options._commit` (`__c`). But we can go one step further
	// and avoid a lot of dirty checks and allocations by setting
	// `options._skipEffects` (`__s`) too.
	const previousSkipEffects = options.__s;
	options.__s = true;

	let res;
	try {
		const serializeFormat = (vnode, context, a0, a1, a2, a3, a4) =>
			_serialize(serializeFormat, format, vnode, context, a0, a1, a2, a3, a4);
		res = serializeFormat(vnode, {});
	} finally {
		// options._commit, we don't schedule any effects in this library right now,
		// so we can pass an empty queue to this hook.
		if (options.__c) options.__c(vnode, EMPTY_ARR);
		EMPTY_ARR.length = 0;
		options.__s = previousSkipEffects;
	}

	return format.result(res);
}

export function serializeToString(vnode) {
	return serialize(vnode, new StringFormat());
}

const noop = () => {};

/**
 * @private
 * @param {Format} format
 * @param {VNode} vnode
 * @param {Object} context
 * @param {?} a0
 * @param {?} a1
 * @param {?} a2
 * @param {?} a3
 * @param {?} a4
 * @return {?}
 */
function _serialize(serialize, format, vnode, context, a0, a1, a2, a3, a4) {
	if (vnode == null || typeof vnode === 'boolean') {
		return vnode;
	}

	// #text nodes
	if (typeof vnode !== 'object') {
		return format.text(serialize, vnode, context);
	}

	if (Array.isArray(vnode)) {
		return format.array(serialize, vnode, context, a0, a1, a2, a3, a4);
	}

	let nodeName = vnode.type,
		props = vnode.props;
	// isComponent = false;

	// components
	if (typeof nodeName === 'function') {
		// isComponent = true;
		if (nodeName === Fragment) {
			const children = [];
			getChildren(children, vnode.props.children);
			return serialize(children, context, a0, a1, a2, a3, a4);
			// opts.shallowHighOrder !== false,
		}

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

		// options._render
		if (options.__r) options.__r(vnode);

		if (
			!nodeName.prototype ||
			typeof nodeName.prototype.render !== 'function'
		) {
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
			rendered = nodeName.call(vnode.__c, props, cctx);
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

			// c = new nodeName(props, context);
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
			if (nodeName.getDerivedStateFromProps)
				c.state = assign(
					assign({}, c.state),
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

			rendered = c.render(c.props, c.state, c.context);
		}

		if (c.getChildContext) {
			context = assign(assign({}, context), c.getChildContext());
		}

		if (options.diffed) options.diffed(vnode);

		return serialize(rendered, context, a0, a1, a2, a3, a4);
	}

	if (typeof vnode.type === 'object') {
		return format.object(serialize, vnode, context, a0, a1, a2, a3, a4);
	}

	return format.element(serialize, vnode, context, a0, a1, a2, a3, a4);
}

const UNSAFE_NAME = /[\s\n\\/='"\0<>]/;
const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

/** @implements {Format} */
export class StringFormat {
	constructor() {
		this._str = '';
	}

	/** @param {string} s */
	push(s) {
		this._str += s;
	}

	/** @return {string} */
	result() {
		return this._str;
	}

	/**
	 * @param {SerializeFunc} serialize
	 * @param {String} str
	 */
	text(serialize, str) {
		this.push(encodeEntities(str));
	}

	/**
	 * @param {SerializeFunc} serialize
	 * @param {Array<VNode>} array
	 * @param {Object} context
	 * @param {boolean} isSvgMode
	 * @param {string} selectValue
	 */
	array(serialize, array, context, isSvgMode, selectValue) {
		for (let i = 0; i < array.length; i++) {
			// if (pretty && i > 0) rendered += '\n';
			serialize(
				array[i],
				context,
				isSvgMode,
				selectValue
				// inner,
			);
		}
	}

	/**
	 * @param {SerializeFunc} serialize
	 * @param {VNode} vnode
	 * @param {Object} context
	 * @param {boolean} isSvgMode
	 * @param {string} selectValue
	 */
	element(serialize, vnode, context, isSvgMode, selectValue) {
		const { type: nodeName, props } = vnode;

		// render JSX to HTML
		this.push('<' + nodeName);

		let propChildren, html;

		if (props) {
			const attrs = Object.keys(props);

			// allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
			// if (opts && opts.sortAttributes === true) attrs.sort();

			for (let i = 0; i < attrs.length; i++) {
				let name = attrs[i],
					v = props[name];
				if (name === 'children') {
					propChildren = v;
					continue;
				}

				if (UNSAFE_NAME.test(name)) {
					continue;
				}

				if (
					// !(opts && opts.allAttributes) &&
					name === 'key' ||
					name === 'ref' ||
					name === '__self' ||
					name === '__source' ||
					name === 'defaultValue'
				) {
					continue;
				}

				if (name === 'className') {
					if (props.class) {
						continue;
					}
					name = 'class';
				} else if (isSvgMode && name.match(/^xlink:?./)) {
					name = name.toLowerCase().replace(/^xlink:?/, 'xlink:');
				}

				if (name === 'htmlFor') {
					if (props.for) {
						continue;
					}
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

				// let hooked =
				//   opts.attributeHook &&
				//   opts.attributeHook(name, v, context, opts, isComponent);
				// if (hooked || hooked === '') {
				//   s += hooked;
				//   continue;
				// }

				if (name === 'dangerouslySetInnerHTML') {
					html = v && v.__html;
				} else if (nodeName === 'textarea' && name === 'value') {
					// <textarea value="a&b"> --> <textarea>a&amp;b</textarea>
					propChildren = v;
				} else if ((v || v === 0 || v === '') && typeof v !== 'function') {
					if (v === true || v === '') {
						v = name;
						this.push(' ' + name);
						continue;
					}

					if (name === 'value') {
						if (nodeName === 'select') {
							selectValue = v;
							continue;
						} else if (nodeName === 'option' && selectValue == v) {
							this.push(' selected');
						}
					}
					this.push(` ${name}="${encodeEntities(v)}"`);
				}
			}
		}

		// // account for >1 multiline attribute
		// if (pretty) {
		//   let sub = s.replace(/\n\s*/, ' ');
		//   if (sub !== s && !~sub.indexOf('\n')) s = sub;
		//   else if (pretty && ~s.indexOf('\n')) s += '\n';
		// }

		this.push('>');

		if (UNSAFE_NAME.test(nodeName))
			throw new Error(
				`${nodeName} is not a valid HTML tag name in ${this._str}`
			);

		let isVoid = VOID_ELEMENTS.test(nodeName);
		// || (opts.voidElements && opts.voidElements.test(nodeName));
		// let pieces = [];

		let children;
		if (html) {
			// if multiline, indent.
			// if (pretty && isLargeString(html)) {
			//   html = '\n' + indentChar + indent(html, indentChar);
			// }
			this.push(html);
		} else if (
			propChildren != null &&
			getChildren((children = []), propChildren).length
		) {
			// let hasLarge = pretty && ~s.indexOf('\n');
			// let lastWasText = false;

			for (let i = 0; i < children.length; i++) {
				let child = children[i];

				if (child != null && child !== false) {
					let childSvgMode =
						nodeName === 'svg'
							? true
							: nodeName === 'foreignObject'
							? false
							: isSvgMode;
					serialize(
						child,
						context,
						childSvgMode,
						selectValue
						// true,
					);

					// if (pretty && !hasLarge && isLargeString(ret)) hasLarge = true;

					// Skip if we received an empty string
					// if (ret) {
					//   if (pretty) {
					//     let isText = ret.length > 0 && ret[0] != '<';
					//     // We merge adjacent text nodes, otherwise each piece would be printed
					//     // on a new line.
					//     if (lastWasText && isText) {
					//       pieces[pieces.length - 1] += ret;
					//     } else {
					//       pieces.push(ret);
					//     }
					//     lastWasText = isText;
					//   } else {
					//     pieces.push(ret);
					//   }
					// }
				}
			}
			// if (pretty && hasLarge) {
			//   for (let i = pieces.length; i--; ) {
			//     pieces[i] = '\n' + indentChar + indent(pieces[i], indentChar);
			//   }
			// }
		}

		// if (pieces.length || html) {
		//   s += pieces.join('');
		// } else if (opts && opts.xml) {
		//   return s.substring(0, s.length - 1) + ' />';
		// }

		if (isVoid && !children && !html) {
			// QQQQQ: do some other way!?
			this._str = this._str.replace(/>$/, ' />');
		} else {
			// if (pretty && ~s.indexOf('\n')) s += '\n';
			this.push(`</${nodeName}>`);
		}
	}

	/**
	 * @param {SerializeFunc} serialize
	 * @param {VNode} vnode
	 * @param {Object} context
	 * @param {boolean} isSvgMode
	 * @param {string} selectValue
	 */
	object(serialize, vnode, context, isSvgMode, selectValue) {
		return this.element(serialize, vnode, context, isSvgMode, selectValue);
	}
}
