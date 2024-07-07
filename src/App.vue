<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-body">
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-body {
  height: 100vh;
  display: grid;
  grid-template-rows: 1fr;
}
</style>
