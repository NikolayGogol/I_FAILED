<route lang="json">
{
  "meta": {
    "layout": "MainLayout"
  }
}
</route>

<template>
  <div class="failure-age-page">
    <section class="failure-age-main">
      <div class="page-header">
        <h1>Failure Age</h1>
        <p>Calculate your resilience and growth over time.</p>
      </div>

      <div class="age-calculator">
        <div class="calculator-input">
          <label>Enter your birth year:</label>
          <input placeholder="1990" type="number">
        </div>
        <div class="calculator-result">
          <p>Your Failure Age is: <strong>33</strong></p>
          <p class="result-desc">You have experienced 33 years of learning opportunities.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import '@/styles/pages/failure-age.scss'
</script>
