<script setup>
  import '@/styles/layouts/auth.scss'
</script>
<template>
  <v-app>
    <v-main class="auth-layout px-6 py-6">
      <img class="auth-logo cursor-pointer" src="../assets/Logo.png" @click="$router.push('/')">
      <v-row class="h-100">
        <v-col class="d-flex flex-column align-center justify-center">
          <h1 class="font-weight-semibold"><b>You are <span>not alone.</span></b></h1>
          <p class="description">Thousands of people are learning from their failures every day.</p>
          <img alt="" src="../assets/auth/1.png">
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
