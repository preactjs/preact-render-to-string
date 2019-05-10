const renderToString = require('.').render;

module.exports = function prepass(vnode) {
	return Promise.resolve(renderToString(vnode, undefined, { allowAsync: true }));
};
