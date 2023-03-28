const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

// This file will only export default exports in commonjs bundles
// instead of guarding them behind a `.default` property.

const filePath = (file) => path.join(process.cwd(), 'dist', file);

// JSX entry
fs.copyFileSync(filePath('jsx.js'), filePath('jsx-entry.js'));
fs.copyFileSync(filePath('jsx.js.map'), filePath('jsx-entry.js.map'));

const sourceJsx = [
	`const entry = require('./jsx-entry');`,
	`entry.default.render = entry.render;`,
	`entry.default.shallowRender = entry.shallowRender;`,
	`module.exports = entry.default;`
].join('\n');
fs.writeFileSync(filePath('jsx.js'), sourceJsx, 'utf-8');

// Verify CJS entries
const main = require(filePath('index.js'));
assert(typeof main === 'function', 'Default export is a function');

const jsx = require(filePath('jsx.js'));
assert(typeof jsx === 'function', 'Default export is a function');
assert(typeof jsx.render === 'function', 'render entry is a function');
assert(
	typeof jsx.shallowRender === 'function',
	'shallowRender entry is a function'
);
