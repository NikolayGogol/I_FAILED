<script setup>
  import '@/styles/layouts/auth.scss'
</script>
<template>
  <v-app>
    <v-main class="auth-layout">
      <v-row class="h-100">
        <v-col class="d-flex align-center justify-center">
          <img alt="" src="https://picsum.photos/606/510">
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <slot />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<style>

</style>
