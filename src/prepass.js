import { renderToString } from '.';

export default function prepass(vnode) {
	return Promise.resolve(renderToString(vnode, undefined, { allowAsync: true }));
}
