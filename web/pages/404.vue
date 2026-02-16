<template>
  <section class="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-zinc-50 dark:bg-zinc-900">
    <div class="max-w-2xl">
      <p class="text-teal-500 text-lg font-semibold mb-3">404 · Page not found</p>
      <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
        Looks like this article slipped into the void.
      </h1>
      <p class="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 mb-6">
        There is no backend call; everything is static Markdown. If GitHub Pages popped a 404, it means the generated file
        is missing, but you can still browse the feed, search, or head back to the homepage.
      </p>
      <div class="flex items-center justify-center gap-4">
        <NuxtLink to="/" class="px-6 py-3 rounded-full bg-zinc-900 text-white font-semibold shadow-lg hover:bg-black transition-colors">
          Return home
        </NuxtLink>
        <NuxtLink
          to="/rss"
          class="px-6 py-3 rounded-full border border-zinc-300 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Check the Markdown guide
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
