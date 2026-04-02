<script setup>
  import { list } from '@/models/age.js'
  import { useFailureAgeStore } from '@/stores/failure-age.js'

  const failureAgeStore = useFailureAgeStore()

</script>

<template>
  <section class="section mt-6 grow-section">
    <h3 class="title-section">Growth Milestones</h3>
    <ul>
      <li v-for="(step, index) in list" :key="index">
        <div class="d-flex align-center">
          <div class="step mr-4">
            <div v-if="failureAgeStore.totalAgeData >= step.age" class="complete">
              <img alt="" src="../../assets/age/Container.png">
            </div>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="d-flex flex-column">
            <h4>{{ step.label }}</h4>
            <p class="text-description fs-14">Age {{ step.age }}</p>
          </div>
        </div>
        <div v-if="failureAgeStore.totalAgeData >= step.age" class="badge">Achieved</div>
      </li>
    </ul>
  </section>
</template>
