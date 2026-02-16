import fs from 'node:fs';
import path from 'node:path';

const categoriesPath = path.join(process.cwd(), 'web', 'content', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
const allowedCategories = categories.map((category) => category.id);
const sourcesPath = path.join(process.cwd(), 'web', 'content', 'sources.json');
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
const allowedSources = sources.map((source) => source.id);

function parseArgs(argv) {
	const args = {};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (!token?.startsWith('--')) continue;

		const key = token.slice(2);
		const value = argv[i + 1]?.startsWith('--') ? '' : argv[i + 1];
		args[key] = value ?? '';

		if (!argv[i + 1]?.startsWith('--')) {
			i += 1;
		}
	}

	return args;
}

function slugify(input) {
	return input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

function printUsageAndExit() {
	console.error('Usage: npm run article:new -- --title "..." --category technology --sourceUrl "https://..." [--source 9to5google] [--sourceName "..."] [--summary "..."] [--thumbnail "..."] [--publishedAt "2026-02-16T08:10:00Z"]');
	console.error('Or positional: npm run article:new -- "Title words" technology https://example.com SourceName Summary words');
	process.exit(1);
}

function detectSourceFromUrl(sourceUrl) {
	try {
		const host = new URL(sourceUrl).hostname.toLowerCase();
		const matched = sources.find((source) =>
			(source.domains || []).some((domain) => host === domain || host.endsWith(`.${domain}`)),
		);

		if (matched) return matched.id;
	} catch {}

	return 'other';
}

function parsePositional(argv) {
	const categoryIndex = argv.findIndex((item) => allowedCategories.includes(item));

	if (categoryIndex <= 0 || categoryIndex >= argv.length - 1) {
		return null;
	}

	const title = argv.slice(0, categoryIndex).join(' ').trim();
	const category = argv[categoryIndex]?.trim();
	const sourceUrl = argv[categoryIndex + 1]?.trim();
	const sourceName = argv[categoryIndex + 2]?.trim() || 'Unknown Source';
	const summary = argv.slice(categoryIndex + 3).join(' ').trim();

	if (!title || !category || !sourceUrl) {
		return null;
	}

	return {
		title,
		category,
		sourceUrl,
		sourceName,
		summary,
		thumbnail: '',
		publishedAt: new Date().toISOString(),
	};
}

const rawArgv = process.argv.slice(2);
const args = parseArgs(rawArgv);
const fallbackPositional = parsePositional(rawArgv);

const title = args.title?.trim() || fallbackPositional?.title;
const category = args.category?.trim() || fallbackPositional?.category;
const sourceUrl = args.sourceUrl?.trim() || fallbackPositional?.sourceUrl;
const sourceName =
	args.sourceName?.trim() || fallbackPositional?.sourceName || 'Unknown Source';
const source = args.source?.trim() || detectSourceFromUrl(sourceUrl || '');
const summary = args.summary?.trim() || fallbackPositional?.summary || '';
const thumbnail = args.thumbnail?.trim() || fallbackPositional?.thumbnail || '';
const publishedAt =
	args.publishedAt?.trim() || fallbackPositional?.publishedAt || new Date().toISOString();

if (!title || !category || !sourceUrl) {
	printUsageAndExit();
}

if (!allowedCategories.includes(category)) {
	console.error(`Invalid category: ${category}`);
	console.error(`Allowed categories: ${allowedCategories.join(', ')}`);
	process.exit(1);
}

if (!allowedSources.includes(source)) {
	console.error(`Invalid source: ${source}`);
	console.error(`Allowed sources: ${allowedSources.join(', ')}`);
	process.exit(1);
}

const datePart = publishedAt.slice(0, 10);
const slug = slugify(title);

if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || slug.length === 0) {
	console.error('Invalid publishedAt or title for filename generation.');
	process.exit(1);
}

const outputDir = path.join(process.cwd(), 'web', 'content', 'articles', category);
const outputFile = path.join(outputDir, `${datePart}-${slug}.md`);

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

if (fs.existsSync(outputFile)) {
	console.error(`File already exists: ${outputFile}`);
	process.exit(1);
}

const frontmatterLines = [
	'---',
	`title: "${title.replace(/"/g, '\\"')}"`,
	`category: "${category}"`,
	`source: "${source}"`,
	`publishedAt: "${publishedAt}"`,
	`sourceName: "${sourceName.replace(/"/g, '\\"')}"`,
	`sourceUrl: "${sourceUrl}"`,
	`thumbnail: "${thumbnail}"`,
	`summary: "${summary.replace(/"/g, '\\"')}"`,
	'---',
	'',
	'Write your markdown content here.',
	'',
];

fs.writeFileSync(outputFile, frontmatterLines.join('\n'), 'utf8');

console.log(`Created: ${outputFile}`);
