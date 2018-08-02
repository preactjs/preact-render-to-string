import './polyfills';
import renderToString from './index';
import { indent, encodeEntities, assign } from './util';
import prettyFormat from 'pretty-format';


// we have to patch in Array support, Possible issue in npm.im/pretty-format
let preactPlugin = {
	test(object) {
		return object && typeof object==='object' && 'nodeName' in object && 'attributes' in object && 'children' in object && !('nodeType' in object);
	},
	print(val, print, indent) {
		return renderToString(val, preactPlugin.context, preactPlugin.opts, true);
	}
};


let prettyFormatOpts = {
	plugins: [preactPlugin]
};

// components without names, kept as a hash for later comparison to return consistent UnnamedComponentXX names.
const UNNAMED = [];

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


function attributeHook(name, value, context, opts, isComponent) {
	let type = typeof value;
	
	// Use render-to-string's built-in handling for these properties
	if (name==='dangerouslySetInnerHTML') return false;

	// always skip null & undefined values, skip false DOM attributes, skip functions if told to
	if (value==null || (type==='function' && !opts.functions)) return '';

	if (opts.skipFalseAttributes && !isComponent && (value===false || ((name==='class' || name==='style') && value===''))) return '';

	let indentChar = typeof opts.pretty==='string' ? opts.pretty : '\t';
	if (type!=='string') {
		if (type==='function' && !opts.functionNames) {
			value = 'Function';
		}
		else {
			preactPlugin.context = context;
			preactPlugin.opts = opts;
			value = prettyFormat(value, prettyFormatOpts);
			if (~value.indexOf('\n')) {
				value = `${indent('\n'+value, indentChar)}\n`;
			}
		}
		return indent(`\n${name}={${value}}`, indentChar);
	}
	return `\n${indentChar}${name}="${encodeEntities(value)}"`;
}


let defaultOpts = {
	attributeHook,
	jsx: true,
	xml: false,
	functions: true,
	functionNames: true,
	skipFalseAttributes: true,
	getComponentName,
	pretty: '  '
};


export default function renderToJsxString(vnode, context, opts, inner) {
	opts = assign(assign({}, defaultOpts), opts || {});
	return renderToString(vnode, context, opts, inner);
}

export function shallowRender(vnode, context, opts) {
	const jsx = opts && opts.jsx===true;
	return renderToJsxString(vnode, context, assign({
		jsx,
		pretty: jsx,
		attributeHook: jsx && attributeHook,
		shallow: true
	}, opts));
}

renderToJsxString.shallowRender = shallowRender;
