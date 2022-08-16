import {
	encodeEntities,
	indent,
	isLargeString,
	styleObjToCss,
	getChildren,
	createComponent,
	getContext,
	UNSAFE_NAME,
	XLINK,
	VOID_ELEMENTS
} from './util';
import { options, Fragment } from 'preact';

// components without names, kept as a hash for later comparison to return consistent UnnamedComponentXX names.
const UNNAMED = [];

export function _renderToStringPretty(
	vnode,
	context,
	opts,
	inner,
	isSvgMode,
	selectValue
) {
	if (vnode == null || typeof vnode === 'boolean') {
		return '';
	}

	// #text nodes
	if (typeof vnode !== 'object') {
		return encodeEntities(vnode);
	}

	let pretty = opts.pretty,
		indentChar = pretty && typeof pretty === 'string' ? pretty : '\t';

	if (Array.isArray(vnode)) {
		let rendered = '';
		for (let i = 0; i < vnode.length; i++) {
			if (pretty && i > 0) rendered = rendered + '\n';
			rendered =
				rendered +
				_renderToStringPretty(
					vnode[i],
					context,
					opts,
					inner,
					isSvgMode,
					selectValue
				);
		}
		return rendered;
	}

	let nodeName = vnode.type,
		props = vnode.props,
		isComponent = false;

	// components
	if (typeof nodeName === 'function') {
		isComponent = true;
		if (opts.shallow && (inner || opts.renderRootComponent === false)) {
			nodeName = getComponentName(nodeName);
		} else if (nodeName === Fragment) {
			const children = [];
			getChildren(children, vnode.props.children);
			return _renderToStringPretty(
				children,
				context,
				opts,
				opts.shallowHighOrder !== false,
				isSvgMode,
				selectValue
			);
		} else {
			let rendered;

			let c = (vnode.__c = createComponent(vnode, context));

			// options._diff
			if (options.__b) options.__b(vnode);

			// options._render
			let renderHook = options.__r;

			if (
				!nodeName.prototype ||
				typeof nodeName.prototype.render !== 'function'
			) {
				let cctx = getContext(nodeName, context);

				// If a hook invokes setState() to invalidate the component during rendering,
				// re-render it up to 25 times to allow "settling" of memoized states.
				// Note:
				//   This will need to be updated for Preact 11 to use internal.flags rather than component._dirty:
				//   https://github.com/preactjs/preact/blob/d4ca6fdb19bc715e49fd144e69f7296b2f4daa40/src/diff/component.js#L35-L44
				let count = 0;
				while (c.__d && count++ < 25) {
					c.__d = false;

					if (renderHook) renderHook(vnode);

					// stateless functional components
					rendered = nodeName.call(vnode.__c, props, cctx);
				}
			} else {
				let cctx = getContext(nodeName, context);

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

				if (renderHook) renderHook(vnode);

				rendered = c.render(c.props, c.state, c.context);
			}

			if (c.getChildContext) {
				context = Object.assign({}, context, c.getChildContext());
			}

			if (options.diffed) options.diffed(vnode);
			return _renderToStringPretty(
				rendered,
				context,
				opts,
				opts.shallowHighOrder !== false,
				isSvgMode,
				selectValue
			);
		}
	}

	// render JSX to HTML
	let s = '<' + nodeName,
		propChildren,
		html;

	if (props) {
		let attrs = Object.keys(props);

		// allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
		if (opts && opts.sortAttributes === true) attrs.sort();

		for (let i = 0; i < attrs.length; i++) {
			let name = attrs[i],
				v = props[name];
			if (name === 'children') {
				propChildren = v;
				continue;
			}

			if (UNSAFE_NAME.test(name)) continue;

			if (
				!(opts && opts.allAttributes) &&
				(name === 'key' ||
					name === 'ref' ||
					name === '__self' ||
					name === '__source')
			)
				continue;

			if (name === 'defaultValue') {
				name = 'value';
			} else if (name === 'defaultChecked') {
				name = 'checked';
			} else if (name === 'defaultSelected') {
				name = 'selected';
			} else if (name === 'className') {
				if (typeof props.class !== 'undefined') continue;
				name = 'class';
			} else if (isSvgMode && XLINK.test(name)) {
				name = name.toLowerCase().replace(/^xlink:?/, 'xlink:');
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
				s = s + hooked;
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
						s = s + ' ' + name;
						continue;
					}
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
						typeof props.selected === 'undefined'
					) {
						s = s + ` selected`;
					}
				}
				s = s + ` ${name}="${encodeEntities(v)}"`;
			}
		}
	}

	// account for >1 multiline attribute
	if (pretty) {
		let sub = s.replace(/\n\s*/, ' ');
		if (sub !== s && !~sub.indexOf('\n')) s = sub;
		else if (pretty && ~s.indexOf('\n')) s = s + '\n';
	}

	s = s + '>';

	if (UNSAFE_NAME.test(nodeName))
		throw new Error(`${nodeName} is not a valid HTML tag name in ${s}`);

	let isVoid =
		VOID_ELEMENTS.test(nodeName) ||
		(opts.voidElements && opts.voidElements.test(nodeName));
	let pieces = [];

	let children;
	if (html) {
		// if multiline, indent.
		if (pretty && isLargeString(html)) {
			html = '\n' + indentChar + indent(html, indentChar);
		}
		s = s + html;
	} else if (
		propChildren != null &&
		getChildren((children = []), propChildren).length
	) {
		let hasLarge = pretty && ~s.indexOf('\n');
		let lastWasText = false;

		for (let i = 0; i < children.length; i++) {
			let child = children[i];

			if (child != null && child !== false) {
				let childSvgMode =
						nodeName === 'svg'
							? true
							: nodeName === 'foreignObject'
							? false
							: isSvgMode,
					ret = _renderToStringPretty(
						child,
						context,
						opts,
						true,
						childSvgMode,
						selectValue
					);

				if (pretty && !hasLarge && isLargeString(ret)) hasLarge = true;

				// Skip if we received an empty string
				if (ret) {
					if (pretty) {
						let isText = ret.length > 0 && ret[0] != '<';

						// We merge adjacent text nodes, otherwise each piece would be printed
						// on a new line.
						if (lastWasText && isText) {
							pieces[pieces.length - 1] += ret;
						} else {
							pieces.push(ret);
						}

						lastWasText = isText;
					} else {
						pieces.push(ret);
					}
				}
			}
		}
		if (pretty && hasLarge) {
			for (let i = pieces.length; i--; ) {
				pieces[i] = '\n' + indentChar + indent(pieces[i], indentChar);
			}
		}
	}

	if (pieces.length || html) {
		s = s + pieces.join('');
	} else if (opts && opts.xml) {
		return s.substring(0, s.length - 1) + ' />';
	}

	if (isVoid && !children && !html) {
		s = s.replace(/>$/, ' />');
	} else {
		if (pretty && ~s.indexOf('\n')) s = s + '\n';
		s = s + `</${nodeName}>`;
	}

	return s;
}

function getComponentName(component) {
	return (
		component.displayName ||
		(component !== Function && component.name) ||
		getFallbackComponentName(component)
	);
}

function getFallbackComponentName(component) {
	let str = Function.prototype.toString.call(component),
		name = (str.match(/^\s*function\s+([^( ]+)/) || '')[1];
	if (!name) {
		// search for an existing indexed name for the given component:
		let index = -1;
		for (let i = UNNAMED.length; i--; ) {
			if (UNNAMED[i] === component) {
				index = i;
				break;
			}
		}
		// not found, create a new indexed name:
		if (index < 0) {
			index = UNNAMED.push(component) - 1;
		}
		name = `UnnamedComponent${index}`;
	}
	return name;
}
