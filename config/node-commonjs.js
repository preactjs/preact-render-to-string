const fs = require('fs');
const path = require('path');

// This file will only export default exports in commonjs bundles
// instead of guarding them behind a `.default` property.

const filePath = (file) => path.join(process.cwd(), 'dist', file);

// Main entry
fs.copyFileSync(filePath('index.js'), filePath('commonjs.js'));
fs.copyFileSync(filePath('index.js.map'), filePath('commonjs.js.map'));

const source = [
	`const mod = require('./commonjs');`,
	`mod.default.renderToStaticMarkup = mod.default;`,
	`mod.default.renderToString = mod.default;`,
	`mod.default.render = mod.default;`,
	`module.exports = mod.default;`
].join('\n');
fs.writeFileSync(filePath('index.js'), source, 'utf-8');

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
