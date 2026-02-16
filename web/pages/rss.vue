<script setup lang="ts">
import { MANUAL_CATEGORIES } from '~~/web/lib/manual-categories';

useHead({
    title: 'Markdown Feed Guide',
	meta: [
		{
			name: 'description',
            content: 'How to manage frontend-only markdown content and source filtering',
		},
	],
});
</script>

<style scoped>
@reference "../assets/css/main.css";

code {
    @apply bg-zinc-100 dark:bg-zinc-800 rounded-md px-1 py-0.5;
}
</style>

<template>
    <article class="flex flex-col gap-3 text-zinc-700 dark:text-zinc-400 pt-4 mb-10">
        <p>
            This version is frontend-only. Articles are updated manually using markdown files only.
        </p>
        <p>
            Add or edit files in <code>web/content/articles/&lt;category&gt;/</code> and include frontmatter:
        </p>
        <pre class="text-sm p-3 rounded bg-zinc-100 dark:bg-zinc-800 overflow-x-auto">---
title: "Article title"
category: "technology"
publishedAt: "2026-02-16T08:10:00Z"
sourceName: "Publisher"
sourceUrl: "https://example.com/article"
thumbnail: "https://example.com/image.jpg"
summary: "Short summary"
---
Markdown content here.
        </pre>
        <p>
            There is no automatic crawler in this edition. You fully control article content, category, date, and source metadata.
        </p>
        <p>
            Supported categories (editable in <code>web/content/categories.json</code>):
        </p>
        <ul class="list-disc list-inside flex flex-col gap-1">
            <li v-for="category in MANUAL_CATEGORIES" :key="category.id">
                <strong>{{ category.name }}</strong> (<code>{{ category.id }}</code>)
            </li>
        </ul>
    </article>
</template>