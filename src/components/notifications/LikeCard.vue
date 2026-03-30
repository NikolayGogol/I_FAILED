<script setup>
  const props = defineProps({
    data: {
      type: Object,
      required: true,
    },
  })
</script>

<template>
  <pre>{{ data }}</pre>
</template>

<style scoped lang="scss">

</style>
