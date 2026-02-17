<template>
  <div class="main-page">
    <v-app-bar app color="white" flat>
      <v-container class="py-0 fill-height">
        <v-toolbar-title class="font-weight-bold">I FAILED</v-toolbar-title>
        <v-spacer />
        <v-btn text>Home</v-btn>
        <v-btn text>Features</v-btn>
        <v-btn text>Pricing</v-btn>
        <v-btn text>Contact</v-btn>
        <v-spacer />
        <div v-if="authStore.user">
          <v-btn text @click="handleLogout">Log out</v-btn>
        </div>
        <div v-else>
          <v-btn text to="/login">Log in</v-btn>
          <v-btn class="get-started-btn" color="primary" depressed to="/register">Get started</v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="main-content" fluid>
        <v-row align="center" class="hero-section" justify="center">
          <v-col class="text-center" cols="12" md="8">
            <h1 class="main-title">This is a main title for a page</h1>
            <p class="main-subtitle">
              And this is a subtitle for a page, which is a little bit longer than the title.
            </p>
            <v-btn class="get-started-main-btn" color="primary" large to="/register">Get started</v-btn>
          </v-col>
        </v-row>

        <v-row class="features-section">
          <v-col cols="12">
            <h2 class="section-title text-center">Features</h2>
          </v-col>
          <v-col v-for="n in 3" :key="n" md="4">
            <v-card class="feature-card" flat>
              <v-card-title>Feature {{ n }}</v-card-title>
              <v-card-text>
                This is a description for feature {{ n }}. It explains what this feature is about.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="pricing-section">
          <v-col cols="12">
            <h2 class="section-title text-center">Pricing</h2>
          </v-col>
          <v-col v-for="n in 3" :key="n" md="4">
            <v-card class="pricing-card" flat>
              <v-card-title>Plan {{ n }}</v-card-title>
              <v-card-text>
                <p class="price-text">$ {{ n * 10 }} / month</p>
                <v-btn block color="primary">Choose Plan</v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="cta-section">
          <v-col class="text-center" cols="12">
            <h2 class="section-title">Ready to get started?</h2>
            <p class="section-subtitle">Join us now and start your journey.</p>
            <v-btn class="get-started-cta-btn" color="primary" large to="/register">Get started</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer class="footer" color="grey lighten-4">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <p>&copy; {{ new Date().getFullYear() }} I FAILED. All rights reserved.</p>
          </v-col>
          <v-col class="text-right" cols="12" md="6">
            <v-btn icon><v-icon>mdi-facebook</v-icon></v-btn>
            <v-btn icon><v-icon>mdi-twitter</v-icon></v-btn>
            <v-btn icon><v-icon>mdi-linkedin</v-icon></v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </div>
</template>

<script setup>
  import { useAuthStore } from '@/stores/auth'
  import '@/styles/pages/index.scss'

  const authStore = useAuthStore()

  async function handleLogout () {
    await authStore.logout()
  }
</script>
