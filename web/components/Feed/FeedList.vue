<script setup lang="ts">
import Fuse from 'fuse.js';
import sAgo from 's-ago';
import dayjs from 'dayjs';
import { DEFAULT_CATEGORY, isManualCategoryValid } from '~~/web/lib/manual-categories';
import { getSourceNameById, MANUAL_SOURCES } from '~~/web/lib/manual-sources';
import { getAllManualArticles } from '~~/web/lib/manual-feed';
import type { Article } from '~~/web/lib/types';

const route = useRoute();
const category = computed(() => {
  const currentCategory = route.params.category as string | undefined;

  if (!currentCategory || !isManualCategoryValid(currentCategory)) {
    return DEFAULT_CATEGORY;
  }

  return currentCategory;
});
const date = computed(() => route.params.date as string | undefined);
const sourceFilter = ref<string>('all');

const allArticles = computed(() => getAllManualArticles());

const filteredArticles = computed(() => {
  const byCategory = allArticles.value.filter(
    (article) => article.category === category.value,
  );

  if (!date.value) return byCategory;

  return byCategory.filter(
    (article) => dayjs(article.publishedAt).format('YYYY-MM-DD') === date.value,
  );
});

const sourceOptions = computed(() => {
  const sourceIds = [...new Set(filteredArticles.value.map((a) => a.source))];

  const configured = MANUAL_SOURCES.filter((source) => sourceIds.includes(source.id)).map(
    (source) => ({ label: source.name, value: source.id }),
  );

  const fallback = sourceIds
    .filter((id) => !MANUAL_SOURCES.some((source) => source.id === id))
    .map((id) => ({ label: getSourceNameById(id), value: id }));

  return [
    { label: 'All sources', value: 'all' },
    ...configured,
    ...fallback,
  ];
});

const sourceFilteredArticles = computed(() => {
  if (sourceFilter.value === 'all') return filteredArticles.value;

  return filteredArticles.value.filter(
    (article) => article.source === sourceFilter.value,
  );
});

const refresh = () => {
  window.location.reload();
};

const serverUpdatedAt = computed(() => {
  if (allArticles.value.length === 0) return null;

  const timestamp = allArticles.value[0]?.createdAt ?? new Date().toISOString();

	return {
    ago: sAgo(new Date(timestamp)),
    dateString: new Date(timestamp).toLocaleString(),
	};
});

const input = ref('');
const result = computed(() => {
  const entries = sourceFilteredArticles.value as Article[];

	const fuse = new Fuse(entries, {
		threshold: 0.5,
    keys: ['title', 'summary', 'content', 'link', 'publisher'],
		includeMatches: true,
	});

	if (toValue(input).length === 0) return entries;

	return fuse.search(toValue(input)).map((i) => i.item);
});

const centerBox = 'flex flex-row gap-1.5 justify-center items-center h-32';
</script>

<style scoped>
</style>

<template>
  <div v-if="filteredArticles.length > 0">
    <div class="flex flex-col sm:flex-row sm:items-center mb-4 gap-2">
      <p class="text-zinc-700 dark:text-zinc-300 font-light">
        Total: {{ sourceFilteredArticles.length }} articles
      </p>
      <div class="flex flex-col sm:flex-row gap-2">
        <USelect
            v-model="sourceFilter"
            :items="sourceOptions"
            class="w-52"
            color="neutral"
            variant="subtle"
            title="Filter by source"
        />
        <UInput
            icon="i-hugeicons-search-01"
            color="neutral"
            :trailing="false"
            placeholder="Search..."
            v-model="input"
        />
        <FeedRefresh :refresh="refresh"/>
      </div>
    </div>
    <div class="mb-3" v-if="serverUpdatedAt">
      <p class="text-zinc-600 dark:text-zinc-400 font-light italic">
        Data updated: {{ serverUpdatedAt.ago }} <span class="hidden sm:inline dark:text-zinc-500">({{ serverUpdatedAt.dateString }})</span> (manual markdown)
      </p>
    </div>
    <div class="flex flex-col divide-y divide-zinc-300 dark:divide-zinc-700" v-if="result.length > 0">
      <div v-for="d in result" :key="d.id" class="py-2">
        <FeedItem :entry="d"/>
      </div>
    </div>
    <div v-else class="center-box">
      <UIcon name="i-hugeicons-search-remove" class="w-5 h-5"/>
      No search results
    </div>
  </div>
  <div v-else class="flex flex-col gap-3 items-center">
    <div :class="centerBox">
      <UIcon name="i-hugeicons-no-meeting-room" class="w-5 h-5"/>
      No markdown articles found
    </div>
  </div>
</template>
