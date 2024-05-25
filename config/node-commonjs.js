const fs = require('fs');
const path = require('path');

// This file will only export default exports in commonjs bundles
// instead of guarding them behind a `.default` property.

const filePath = (file) => path.join(process.cwd(), 'dist', file);

// Main entry
fs.copyFileSync(filePath('index.js'), filePath('commonjs.js'));

const source = [
	`const mod = require('./commonjs');`,
	`mod.default.renderToStringAsync = mod.renderToStringAsync;`,
	`mod.default.renderToStaticMarkup = mod.default;`,
	`mod.default.renderToString = mod.default;`,
	`mod.default.render = mod.default;`,
	`module.exports = mod.default;`
].join('\n');
fs.writeFileSync(filePath('index.js'), source, 'utf-8');

// JSX entry
fs.copyFileSync(filePath('jsx/index.js'), filePath('jsx/commonjs.js'));

const sourceJsx = [
	`const entry = require('./commonjs');`,
	`entry.default.render = entry.render;`,
	`entry.default.shallowRender = entry.shallowRender;`,
	`module.exports = entry.default;`
].join('\n');
fs.writeFileSync(filePath('jsx/index.js'), sourceJsx, 'utf-8');
