export interface ManualCategory {
	id: string;
	name: string;
}

import categories from '~~/web/content/categories.json';

export const MANUAL_CATEGORIES: ManualCategory[] = categories;

export const DEFAULT_CATEGORY = MANUAL_CATEGORIES[0]!.id;

export function isManualCategoryValid(category: string) {
	return MANUAL_CATEGORIES.some((c) => c.id === category);
}

export function getCategoryNameById(category: string) {
	return MANUAL_CATEGORIES.find((c) => c.id === category)?.name ?? category;
}
