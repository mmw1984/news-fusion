export interface Article {
	id: string;
	guid: string;
	link: string;
	title: string;
	summary: string;
	thumbnail: string | null;
	category: string;
	source: string;
	publishedAt: string;
	createdAt: string;
	publisher: string;
	content: string;
}
