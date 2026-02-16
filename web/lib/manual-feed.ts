import dayjs from 'dayjs';
import { DEFAULT_CATEGORY, isManualCategoryValid } from './manual-categories';
import { detectSourceId, getSourceNameById } from './manual-sources';
import type { Article } from './types';

type ParsedFrontmatter = Record<string, string>;

function splitFrontmatter(raw: string): {
	frontmatter: ParsedFrontmatter;
	body: string;
} {
	const matched = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

	if (!matched) {
		return {
			frontmatter: {},
			body: raw.trim(),
		};
	}

	const frontmatterBlock = matched[1] ?? '';
	const markdownBody = matched[2] ?? '';

	const frontmatter = frontmatterBlock
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith('#'))
		.reduce<ParsedFrontmatter>((acc, line) => {
			const idx = line.indexOf(':');

			if (idx <= 0) return acc;

			const key = line.slice(0, idx).trim();
			const value = line
				.slice(idx + 1)
				.trim()
				.replace(/^"(.*)"$/, '$1')
				.replace(/^'(.*)'$/, '$1');

			if (key.length > 0) {
				acc[key] = value;
			}

			return acc;
		}, {});

	return {
		frontmatter,
		body: markdownBody.trim(),
	};
}

function stripMarkdown(markdown: string) {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/^[#>*\-\d.\s]+/gm, '')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

function toArticle(filePath: string, raw: string): Article | null {
	const { frontmatter, body } = splitFrontmatter(raw);

	const title = frontmatter.title;
	const sourceUrl = frontmatter.sourceUrl;

	if (!title || !sourceUrl) {
		return null;
	}

	const category = frontmatter.category ?? DEFAULT_CATEGORY;
	const normalizedCategory = isManualCategoryValid(category)
		? category
		: DEFAULT_CATEGORY;

	const source = detectSourceId({
		frontmatterSource: frontmatter.source,
		sourceUrl,
		sourceName: frontmatter.sourceName,
	});

	const publishedAt = dayjs(frontmatter.publishedAt).isValid()
		? dayjs(frontmatter.publishedAt).toISOString()
		: dayjs().toISOString();

	const cleanedBody = stripMarkdown(body);
	const summary = frontmatter.summary?.trim() || cleanedBody.slice(0, 220);

	return {
		id: filePath,
		guid: filePath,
		link: sourceUrl,
		title,
		summary,
		thumbnail: frontmatter.thumbnail || null,
		category: normalizedCategory,
		source,
		publishedAt,
		createdAt: publishedAt,
		publisher:
			frontmatter.sourceName ||
			getSourceNameById(source) ||
			new URL(sourceUrl).hostname,
		content: body,
	};
}

export function getAllManualArticles() {
	const files = import.meta.glob('../content/articles/**/*.md', {
		eager: true,
		import: 'default',
		query: '?raw',
	}) as Record<string, string>;

	return Object.entries(files)
		.map(([path, raw]) => toArticle(path, raw))
		.filter((article): article is Article => article !== null)
		.sort(
			(a, b) =>
				dayjs(b.publishedAt).valueOf() - dayjs(a.publishedAt).valueOf(),
		);
}

export function getManualArticlesByCategory(category: string) {
	return getAllManualArticles().filter((article) => article.category === category);
}

export function getManualArticlesByDate(category: string, date: string) {
	return getAllManualArticles().filter((article) => {
		return (
			article.category === category &&
			dayjs(article.publishedAt).format('YYYY-MM-DD') === date
		);
	});
}
