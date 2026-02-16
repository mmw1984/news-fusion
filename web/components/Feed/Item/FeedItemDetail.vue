<script setup lang="ts">
import type { Article } from '~~/web/lib/types';
import { renderMarkdown } from '~~/web/lib/markdown';

const props = defineProps<{
	entry: Article;
}>();

const renderedContent = computed(() => renderMarkdown(props.entry.content));
</script>

<style scoped>
.article-content :deep(img) {
  @apply my-3 rounded max-w-full;
}

.article-content :deep(a) {
  @apply underline text-blue-500 dark:text-blue-400;
}

.article-content :deep(p) {
  @apply mb-3 leading-relaxed;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  @apply mt-4 mb-2 font-semibold text-zinc-800 dark:text-zinc-200;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  @apply pl-5 mb-3;
}
</style>

<template>
  <FeedPublisher :url="props.entry.link" :name="props.entry.publisher" class="mt-1 mb-2"/>
  <div class="relative mx-auto">
    <FeedItemThumbnail :imageURL="props.entry.thumbnail" v-if="props.entry.thumbnail && props.entry.thumbnail.length > 0" />
    <p class="text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">{{ props.entry.summary }}</p>
    <article class="article-content text-zinc-700 dark:text-zinc-300" v-html="renderedContent" />
    <div class="clear-both"></div>
  </div>
  <a class="underline text-blue-500 dark:text-blue-400 italic font-light" :href="props.entry.link" target="_blank" rel="noopener noreferrer">
    Read More
  </a>
</template>
