<template>
  <div>instance={{ id }}</div>
</template>

<script setup lang="ts">
const id = useDcupl().query.one({ modelKey: "Instance", itemKey: "current" })?.id;
</script>
