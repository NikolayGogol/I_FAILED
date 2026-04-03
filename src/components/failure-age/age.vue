<script setup>
  import { onMounted, ref } from 'vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useFailureAgeStore } from '@/stores/failure-age'
  import { useNumeral } from '@/utils/format-number.js'
  import DobModal from './DobModal.vue' // Import the new component

  const showFormula = ref(false)
  const showDobModal = ref(false) // Still need this to control the modal

  const failureAgeStore = useFailureAgeStore()
  const authStore = useAuthStore()

  onMounted(() => {
    failureAgeStore.fetchFailureAgeStats()
    if (!authStore.user.dob) {
      showDobModal.value = true
    }
  })

  function onDobUpdated () {
    // Optionally, you can add logic here to refresh data that depends on the DOB.
    // For example, re-fetching failure age stats if they are dependent on the user's age.
    failureAgeStore.fetchFailureAgeStats()
  }
</script>

<template>
  <div>
    <div class="ages-wrapper">
      <div class="d-flex align-center justify-center age-header">
        <h1>{{ useNumeral(failureAgeStore.totalAgeData) }}</h1>
        <p class="ml-2">years</p>
      </div>
      <v-progress-linear
        v-model="failureAgeStore.calculateProgressData"
        color="primary"
        height="10"
        rounded
      />
      <div class="d-flex align-center justify-space-between legend">
        <p>18 (Base)</p>
        <p>50 (Sage)</p>
      </div>
      <div class="d-flex calculator justify-center mt-6">
        <div class="d-flex flex-column px-13 align-center">
          <div class="label">Actual Age</div>
          <p>{{ failureAgeStore.actualAge }}</p>
        </div>
        <div class="d-flex flex-column px-13 border-left align-center">
          <div class="label">Wisdom Gap</div>
          <p>{{ useNumeral(failureAgeStore.wisdomGapData) }}</p>
        </div>
      </div>
      <div
        class="toggle-btn d-flex align-center justify-center mt-5 cursor-pointer"
        @click="showFormula = !showFormula"
      >
        <span class="text-primary fs-14">{{ showFormula ? 'Hide' : 'Show' }} Formula</span>
        <v-icon class="ml-3" color="primary" :icon="showFormula ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </div>
    </div>
    <v-expand-transition>
      <div v-show="showFormula" class="formula">
        <div class="title">How It's Calculated</div>
        <ul>
          <li class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <img alt="" src="../../assets/age/Icon.png">
              <div class="d-flex flex-column ml-3">
                <div class="label mb-0">Base Age</div>
                <p class="text-description">Everyone starts here</p>
              </div>
            </div>
            <div class="result">18.0</div>
          </li>
          <li class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <img alt="" src="../../assets/age/dasda.png">
              <div class="d-flex flex-column ml-3">
                <div class="label mb-0">Major Failures Shared</div>
                <p class="text-description">+1.0 year each</p>
              </div>
            </div>
            <div class="d-flex flex-column align-end justify-center">
              <p class="text-description">{{ failureAgeStore.majorFailuresSharedData.raw }} x 1.0</p>
              <div class="result" style="color: #F3A412">+{{ useNumeral(failureAgeStore.majorFailuresSharedData.count) }}</div>
            </div>
          </li>
          <li class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <img alt="" src="../../assets/age/order.png">
              <div class="d-flex flex-column ml-3">
                <div class="label mb-0">Lessons Learned</div>
                <p class="text-description">+0.5 years each</p>
              </div>
            </div>
            <div class="d-flex flex-column align-end justify-center">
              <p class="text-description">{{ failureAgeStore.lessonsLearnedTotalData.raw }} × 0.5</p>
              <div class="result" style="color: #31953A">+{{ useNumeral(failureAgeStore.lessonsLearnedTotalData.count) }}</div>
            </div>
          </li>
          <li class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <img alt="" src="../../assets/age/comment.png">
              <div class="d-flex flex-column ml-3">
                <div class="label mb-0">Helpful Comments</div>
                <p class="text-description">+0.25 years each</p>
              </div>
            </div>
            <div class="d-flex flex-column align-end justify-center">
              <p class="text-description">{{ failureAgeStore.helpfulCommentsTotalData.raw }} × 0.25</p>
              <div class="result">+{{ useNumeral(failureAgeStore.helpfulCommentsTotalData.count) }}</div>
            </div>
          </li>
          <li class="d-flex align-center justify-space-between bg-custom">
            <div class="d-flex align-center">
              <img alt="" src="../../assets/age/Heart-1.png">
              <div class="d-flex flex-column ml-3">
                <div class="label mb-0">Unresolved Failures</div>
                <p class="text-description">-0.1 years each</p>
              </div>
            </div>
            <div class="d-flex flex-column align-center justify-center">
              <p class="text-description">{{ failureAgeStore.unresolvedFailuresData.raw }} × 0.1</p>
              <div class="result" style="color: #C8372B">{{ useNumeral(failureAgeStore.unresolvedFailuresData.count) }}</div>
            </div>
          </li>
        </ul>
      </div>
    </v-expand-transition>

    <!-- DOB Input Modal -->
    <dob-modal v-model="showDobModal" @dob-updated="onDobUpdated" />
  </div>
</template>
