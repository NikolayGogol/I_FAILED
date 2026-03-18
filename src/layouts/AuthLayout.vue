<script setup>
  import '@/styles/layouts/auth.scss'
</script>
<template>
  <v-app>
    <v-main class="auth-layout">
      <img class="auth-logo cursor-pointer" src="../assets/Logo.png" @click="$router.push('/')">
      <v-row class="h-100" no-gutters>
        <v-col class="d-none d-md-flex flex-column align-center justify-center" md="6" xs="0">
          <h1 class="font-weight-semibold d-none d-md-block"><b>You are <span>not alone.</span></b></h1>
          <p class="description">Thousands of people are learning from their failures every day.</p>
          <img alt="" class="auth-image" src="../assets/auth/1.png">
        </v-col>
        <v-col class="d-flex align-center justify-center" md="6" xs="12">
          <slot />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<style>

</style>
