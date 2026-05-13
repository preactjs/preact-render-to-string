import { appendFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

async function hasPublishedVersion(pkg) {
	const response = await fetch(
		`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`,
		{ headers: { accept: 'application/vnd.npm.install-v1+json' } }
	);

	if (response.status === 404) {
		return false;
	}

	if (!response.ok) {
		throw new Error(
			`Failed to query ${pkg.name}: ${response.status} ${response.statusText}`
		);
	}

	const metadata = await response.json();
	return Object.prototype.hasOwnProperty.call(
		metadata.versions ?? {},
		pkg.version
	);
}

async function main() {
	const pkg = JSON.parse(await readFile('package.json', 'utf8'));
	const isPublished = await hasPublishedVersion(pkg);

	if (isPublished) {
		console.log(`${pkg.name}@${pkg.version} is already published`);
	} else {
		console.log(`${pkg.name}@${pkg.version} is not published yet`);
	}

	const shouldPublish = !isPublished;
	const output =
		[
			`has_unpublished=${String(shouldPublish)}`,
			`should_publish=${String(shouldPublish)}`
		].join('\n') + '\n';

	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, output);
	} else {
		process.stdout.write(output);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
