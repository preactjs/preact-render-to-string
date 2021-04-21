import { encodeEntities } from './util.js';

const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

export default function* render(vnode, ctx) {
	const type = typeof vnode;
	if (vnode == null || type === 'boolean') return;
	if (type !== 'object') {
		yield encodeEntities(vnode);
		return;
	}
	if (Array.isArray(vnode)) {
		for (const child of vnode) yield* render(child, ctx);
		return;
	}
	const tag = vnode.type;
	if (typeof tag === 'function') {
		let c, children;
		if (tag.prototype && tag.prototype.render) {
			vnode.__c = c = new tag(vnode.props, ctx);
			c.__v = vnode;
			c.props = vnode.props;
			if (!c.state) c.state = {};
			c.context = ctx;
			if (c.componentWillMount) c.componentWillMount();
			if (c.getChildContext) ctx = Object.assign({}, ctx, c.getChildContext());
			children = c.render(c.props, c.state, c.context);
		} else {
			vnode.__c = c = {
				__v: vnode,
				props: vnode.props,
				state: {},
				context: ctx
			};
			children = tag.call(render, c.props, ctx);
		}
		yield* render(children, ctx);
		return;
	}
	let str = `<${tag}`;
	let children;
	for (let prop in vnode.props) {
		let v = vnode.props[prop];
		if (prop === 'children') children = v;
		else if (prop !== 'ref' && prop !== 'key') {
			const aria = prop.startsWith('aria-');
			if (v != null && (v !== false || aria)) {
				str = str + ' ' + prop;
				if (v !== true || aria) str = str + '="' + encodeEntities(v) + '"';
			}
		}
	}
	str = str + '>';
	yield str;
	if (children) yield* render(children, ctx);
	if (!VOID_ELEMENTS.test(tag)) yield `</${tag}>`;
}
