// DOM properties that should NOT have "px" added when numeric
export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i;
export const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
export const UNSAFE_NAME = /[\s\n\\/='"\0<>]/;
export const XLINK = /^xlink:?./;

const ENCODED_ENTITIES = /["&<]/;

export function encodeEntities(str) {
	// Ensure we're always parsing and returning a string:
	str += '';

	// Skip all work for strings with no entities needing encoding:
	if (ENCODED_ENTITIES.test(str) === false) return str;

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

const CSS_REGEX = /([A-Z])/g;
// Convert an Object style to a CSSText string
export function styleObjToCss(s) {
	let str = '';
	for (let prop in s) {
		let val = s[prop];
		if (val != null && val !== '') {
			if (str) str += ' ';
			// str += jsToCss(prop);
			str +=
				prop[0] == '-'
					? prop
					: JS_TO_CSS[prop] ||
					  (JS_TO_CSS[prop] = prop.replace(CSS_REGEX, '-$1').toLowerCase());

			if (typeof val === 'number' && IS_NON_DIMENSIONAL.test(prop) === false) {
				str = str + ': ' + val + 'px;';
			} else {
				str = str + ': ' + val + ';';
			}
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

// Necessary for createContext api. Setting this property will pass
// the context value as `this.context` just for this component.
export function getContext(nodeName, context) {
	let cxType = nodeName.contextType;
	let provider = cxType && context[cxType.__c];
	return cxType != null
		? provider
			? provider.props.value
			: cxType.__
		: context;
}
