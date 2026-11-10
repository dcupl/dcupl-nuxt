<template>
  <div>count={{ count }}</div>
</template>

<script setup lang="ts">
const route = useRoute();
const dcupl = useDcupl();
const listKey = `articles-${route.query.q ?? "default"}`;
dcupl.lists.create({ modelKey: "Article", listKey });
// keep the list open across an await so concurrent requests overlap, then look
// it up again by key (as child components do); a list destroyed by another
// request is gone from the instance
await new Promise(resolve => setTimeout(resolve, Number(route.query.delay ?? 0)));
const count = dcupl.lists.get(listKey)?.catalog.query.execute().length ?? "missing";
</script>
