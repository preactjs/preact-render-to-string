import mergeStreamsOrStrings from './utils/merge-streams-or-strings';
import stringToStream from './utils/string-to-stream';
import { encodeEntities, styleObjToCss, assign, getChildren } from './util';
import { options, Fragment } from 'preact';

// components without names, kept as a hash for later comparison to return consistent UnnamedComponentXX names.
const UNNAMED = [];

const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;


function renderToNodeStream(vnode, context, opts) {
	if (opts && opts.pretty) {
		throw new Error('pretty is not supported in renderToNodeStream!');
	}

	const result = renderToNodeStreamOrString(vnode, context, opts);

	if (typeof result !== 'string') {
		return result;
	}

	return stringToStream(result);
}

function renderToNodeStreamOrString(vnode, context, opts, inner, isSvgMode, selectValue) {
	if (vnode==null || typeof vnode==='boolean') {
		return '';
	}

	let nodeName = vnode.type,
		props = vnode.props,
		isComponent = false;
	context = context || {};
	opts = opts || {};

	// #text nodes
	if (typeof vnode!=='object' && !nodeName) {
		return encodeEntities(vnode);
	}

	// components
	if (typeof nodeName==='function') {
		isComponent = true;
		if (opts.shallow && (inner || opts.renderRootComponent===false)) {
			nodeName = getComponentName(nodeName);
		}
		else if (nodeName===Fragment) {
			let rendered = [];
			let children = [];
			getChildren(children, vnode.props.children);

			for (let i = 0; i < children.length; i++) {
				rendered.push(renderToNodeStreamOrString(children[i], context, opts, opts.shallowHighOrder!==false, isSvgMode, selectValue));
			}

			return mergeStreamsOrStrings(rendered);
		}
		else {
			let c = vnode.__c = { __v: vnode, context, props: vnode.props };
			if (options.render) options.render(vnode);

			let doRender;

			if (!nodeName.prototype || typeof nodeName.prototype.render!=='function') {
				// Necessary for createContext api. Setting this property will pass
				// the context value as `this.context` just for this component.
				let cxType = nodeName.contextType;
				let provider = cxType && context[cxType.__c];
				let cctx = cxType != null ? (provider ? provider.props.value : cxType._defaultValue) : context;

				// stateless functional components
				doRender = () => {
					try {
						return nodeName.call(vnode.__c, props, cctx);
					}
					catch (e) {
						if (e.then) {
							return e.then(doRender, doRender);
						}

						throw e;
					}
				};
			}
			else {
				// class-based components
				// c = new nodeName(props, context);
				c = vnode.__c = new nodeName(props, context);
				c.__v = vnode;
				// turn off stateful re-rendering:
				c._dirty = c.__d = true;
				c.props = props;
				c.context = context;
				if (nodeName.getDerivedStateFromProps) c.state = assign(assign({}, c.state), nodeName.getDerivedStateFromProps(c.props, c.state));
				else if (c.componentWillMount) c.componentWillMount();
				doRender = () => {
					try {
						return c.render(c.props, c.state || {}, c.context);
					}
					catch (e) {
						if (e.then) {
							return e.then(doRender, doRender);
						}

						throw e;
					}
				};
			}

			const rendered = doRender();
			const { PassThrough } = require('stream');
			const pass = new PassThrough();

			const finish = (renderedVnode) => {
				if (c.getChildContext) {
					context = assign(assign({}, context), c.getChildContext());
				}

				const result = renderToNodeStreamOrString(renderedVnode, context, opts, opts.shallowHighOrder!==false, isSvgMode, selectValue);

				if (typeof result !== 'string') {
					result.pipe(pass);
				}
				else {
					stringToStream(result).pipe(pass);
				}
			};

			if (rendered.then) {
				rendered.then(finish);
			}
			else {
				finish(rendered);
			}

			return pass;
		}
	}

	// render JSX to HTML
	let s = '', html;

	if (props) {
		let attrs = Object.keys(props);

		// allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
		if (opts && opts.sortAttributes===true) attrs.sort();

		for (let i=0; i<attrs.length; i++) {
			let name = attrs[i],
				v = props[name];
			if (name==='children') continue;

			if (name.match(/[\s\n\\/='"\0<>]/)) continue;

			if (!(opts && opts.allAttributes) && (name==='key' || name==='ref')) continue;

			if (name==='className') {
				if (props.class) continue;
				name = 'class';
			}
			else if (isSvgMode && name.match(/^xlink:?./)) {
				name = name.toLowerCase().replace(/^xlink:?/, 'xlink:');
			}

			if (name==='style' && v && typeof v==='object') {
				v = styleObjToCss(v);
			}

			let hooked = opts.attributeHook && opts.attributeHook(name, v, context, opts, isComponent);
			if (hooked || hooked==='') {
				s += hooked;
				continue;
			}

			if (name==='dangerouslySetInnerHTML') {
				html = v && v.__html;
			}
			else if ((v || v===0 || v==='') && typeof v!=='function') {
				if (v===true || v==='') {
					v = name;
					// in non-xml mode, allow boolean attributes
					if (!opts || !opts.xml) {
						s += ' ' + name;
						continue;
					}
				}

				if (name==='value') {
					if (nodeName==='select') {
						selectValue = v;
						continue;
					}
					else if (nodeName==='option' && selectValue==v) {
						s += ` selected`;
					}
				}
				s += ` ${name}="${encodeEntities(v)}"`;
			}
		}
	}

	let isVoid = String(nodeName).match(VOID_ELEMENTS);

	s = `<${nodeName}${s}`;
	if (String(nodeName).match(/[\s\n\\/='"\0<>]/)) throw s;

	if (html) {
		return `${s}${html}${isVoid || opts.xml ? '/>' : `></${nodeName}>`}`;
	}

	let children = [];
	let pieces = [];
	if (props && getChildren(children, props.children).length) {
		for (let i=0; i<children.length; i++) {
			let child = children[i];
			if (child!=null && child!==false) {
				let childSvgMode = nodeName==='svg' ? true : nodeName==='foreignObject' ? false : isSvgMode,
					ret = renderToNodeStreamOrString(child, context, opts, true, childSvgMode, selectValue);
				if (ret) pieces.push(ret);
			}
		}
	}

	if (!pieces.length) {
		return `${s}${isVoid || opts.xml ? '/>' : `></${nodeName}>`}`;
	}

	if (isVoid) {
		console.warn('encountered void element with children...');
	}

	pieces.unshift(`${s}>`);
	pieces.push(`</${nodeName}>`);

	return mergeStreamsOrStrings(pieces);
}

function getComponentName(component) {
	return component.displayName || component!==Function && component.name || getFallbackComponentName(component);
}

function getFallbackComponentName(component) {
	let str = Function.prototype.toString.call(component),
		name = (str.match(/^\s*function\s+([^( ]+)/) || '')[1];
	if (!name) {
		// search for an existing indexed name for the given component:
		let index = -1;
		for (let i=UNNAMED.length; i--; ) {
			if (UNNAMED[i]===component) {
				index = i;
				break;
			}
		}
		// not found, create a new indexed name:
		if (index<0) {
			index = UNNAMED.push(component) - 1;
		}
		name = `UnnamedComponent${index}`;
	}
	return name;
}

export default renderToNodeStream;
