const fs = require('fs');

const copy = (filename) => {
	// Copy .module.js --> .mjs for Node 13 compat.
	fs.writeFileSync(
		`${process.cwd()}/dist/${filename}.mjs`,
		fs.readFileSync(`${process.cwd()}/dist/${filename}.module.js`)
	);
};

copy('index');
copy('jsx');
copy('stream');
copy('stream-node');
