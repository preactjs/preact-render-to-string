export const VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
export const UNSAFE_NAME = /[\s\n\\/='"\0<>]/;
export const XLINK = /^xlink:?./;

// DOM properties that should NOT have "px" added when numeric
const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/;
const ENCODED_ENTITIES = /["&<]/;

/** @param {string} str */
export function encodeEntities(str) {
	// Skip all work for strings with no entities needing encoding:
	if (str.length === 0 || ENCODED_ENTITIES.test(str) === false) return str;

	let last = 0,
		i = 0,
		out = '',
		ch = '';

	// Seek forward in str until the next entity char:
	for (; i < str.length; i++) {
		switch (str.charCodeAt(i)) {
			case 34:
				ch = '&quot;';
				break;
			case 38:
				ch = '&amp;';
				break;
			case 60:
				ch = '&lt;';
				break;
			default:
				continue;
		}
		// Append skipped/buffered characters and the encoded entity:
		if (i !== last) out += str.slice(last, i);
		out += ch;
		// Start the next seek/buffer after the entity's offset:
		last = i + 1;
	}
	if (i !== last) out += str.slice(last, i);
	return out;
}

export let indent = (s, char) =>
	String(s).replace(/(\n+)/g, '$1' + (char || '\t'));

export let isLargeString = (s, length, ignoreLines) =>
	String(s).length > (length || 40) ||
	(!ignoreLines && String(s).indexOf('\n') !== -1) ||
	String(s).indexOf('<') !== -1;

const JS_TO_CSS = {};
const SUFFIX_CACHE = {};

const CSS_REGEX = /([A-Z])/g;
// Convert an Object style to a CSSText string
export function styleObjToCss(s) {
	let str = '';
	for (let prop in s) {
		let val = s[prop];
		if (val != null && val !== '') {
			const name =
				prop[0] == '-'
					? prop
					: JS_TO_CSS[prop] ||
					  (JS_TO_CSS[prop] = prop.replace(CSS_REGEX, '-$1').toLowerCase());

			let suffix = ';';
			if (SUFFIX_CACHE[name]) {
				suffix = 'px';
			} else if (
				typeof val === 'number' &&
				IS_NON_DIMENSIONAL.test(prop.toLowerCase()) === false
			) {
				SUFFIX_CACHE[name] = true;
				suffix = 'px';
			}
			str = str + name + ':' + val + suffix;
		}
	}
	return str || undefined;
}

/**
 * Get flattened children from the children prop
 * @param {Array} accumulator
 * @param {any} children A `props.children` opaque object.
 * @returns {Array} accumulator
 * @private
 */
export function getChildren(accumulator, children) {
	if (Array.isArray(children)) {
		children.reduce(getChildren, accumulator);
	} else if (children != null && children !== false) {
		accumulator.push(children);
	}
	return accumulator;
}

function markAsDirty() {
	this.__d = true;
}

export function createComponent(vnode, context) {
	return {
		__v: vnode,
		context,
		props: vnode.props,
		// silently drop state updates
		setState: markAsDirty,
		forceUpdate: markAsDirty,
		__d: true,
		// hooks
		__h: []
	};
}
