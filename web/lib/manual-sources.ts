export interface ManualSource {
	id: string;
	name: string;
	domains: string[];
}

import sources from '~~/web/content/sources.json';

export const MANUAL_SOURCES: ManualSource[] = sources;

export function isManualSourceValid(source: string) {
	return MANUAL_SOURCES.some((s) => s.id === source);
}

export function getSourceNameById(source: string) {
	return MANUAL_SOURCES.find((s) => s.id === source)?.name ?? source;
}

function normalize(value: string) {
	return value.trim().toLowerCase();
}

function getHostname(url: string) {
	try {
		return new URL(url).hostname.toLowerCase();
	} catch {
		return '';
	}
}

export function detectSourceId(input: {
	frontmatterSource?: string;
	sourceUrl?: string;
	sourceName?: string;
}) {
	const rawSource = input.frontmatterSource ? normalize(input.frontmatterSource) : '';
	if (rawSource && isManualSourceValid(rawSource)) {
		return rawSource;
	}

	const host = input.sourceUrl ? getHostname(input.sourceUrl) : '';
	if (host) {
		const byDomain = MANUAL_SOURCES.find((source) =>
			source.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
		);

		if (byDomain) {
			return byDomain.id;
		}
	}

	const name = input.sourceName ? normalize(input.sourceName) : '';
	if (name) {
		const byName = MANUAL_SOURCES.find((source) => normalize(source.name) === name);
		if (byName) {
			return byName.id;
		}
	}

	return 'other';
}