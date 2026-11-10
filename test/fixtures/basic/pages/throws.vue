<template>
  <div>never rendered</div>
</template>

<script setup lang="ts">
useDcupl().lists.create({ modelKey: "Article", listKey: "before-the-error" });
throw createError({ statusCode: 500, statusMessage: "page failed", fatal: true });
</script>
