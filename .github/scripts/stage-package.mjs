import { appendFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

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

function getDistTag(version) {
	const prerelease = version.match(/-([0-9A-Za-z-]+)(?:\.|$)/);
	return prerelease ? prerelease[1] : 'latest';
}

function collectStageIds(value, ids = new Set()) {
	if (!value || typeof value !== 'object') return ids;

	for (const [key, child] of Object.entries(value)) {
		if (/stage[-_]?id/i.test(key) && typeof child === 'string') {
			ids.add(child);
		} else {
			collectStageIds(child, ids);
		}
	}

	return ids;
}

function runGit(args) {
	const result = spawnSync('git', args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});

	if (result.stdout) process.stdout.write(result.stdout);
	if (result.stderr) process.stderr.write(result.stderr);
	if (result.status !== 0) process.exit(result.status ?? 1);
}

function hasLocalGitTag(tagName) {
	const result = spawnSync(
		'git',
		['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}`],
		{ stdio: 'ignore' }
	);
	return result.status === 0;
}

function createGitTag(tagName) {
	if (hasLocalGitTag(tagName)) {
		console.log(`Git tag ${tagName} already exists locally.`);
	} else {
		runGit(['tag', tagName, '-m', tagName]);
	}

	// changesets/action parses this line, then pushes the tag and creates the GitHub release.
	console.log(`New tag: ${tagName}`);
}

async function main() {
	const pkg = JSON.parse(await readFile('package.json', 'utf8'));
	const changesetConfig = JSON.parse(
		await readFile('.changeset/config.json', 'utf8')
	);

	if (pkg.private) {
		console.log(`${pkg.name}@${pkg.version} is private; skipping staging`);
		return;
	}

	if (await hasPublishedVersion(pkg)) {
		console.log(
			`${pkg.name}@${pkg.version} is already published; skipping staging`
		);
		return;
	}

	const access =
		pkg.publishConfig?.access ?? changesetConfig.access ?? 'public';
	const tag = getDistTag(pkg.version);
	const args = [
		'stage',
		'publish',
		'.',
		'--access',
		access,
		'--tag',
		tag,
		'--json'
	];

	console.log(`Staging ${pkg.name}@${pkg.version} with dist-tag ${tag}`);
	const result = spawnSync('npm', args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});

	if (result.stdout) process.stdout.write(result.stdout);
	if (result.stderr) process.stderr.write(result.stderr);

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	createGitTag(`v${pkg.version}`);

	let stageIds = [];
	try {
		stageIds = [...collectStageIds(JSON.parse(result.stdout))];
	} catch {
		// Keep the raw npm output above as the source of truth if the JSON shape changes.
	}

	if (stageIds.length > 0) {
		const message = [
			`Staged ${pkg.name}@${pkg.version}.`,
			...stageIds.map((id) => `Stage ID: ${id}`),
			'Approve with `npm stage approve <stage-id>` after reviewing the staged package.'
		].join('\n');

		console.log(message);

		if (process.env.GITHUB_STEP_SUMMARY) {
			appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
