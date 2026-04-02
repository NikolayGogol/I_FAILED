<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useFailureAgeStore } from '@/stores/failure-age'
  import { useNumeral } from '@/utils/format-number.js'

  const showFormula = ref(false)
  const actualAge = ref(18)

  const failureAgeStore = useFailureAgeStore()

  onMounted(() => {
    failureAgeStore.fetchFailureAgeStats()
  })

  const majorFailuresShared = computed(() => {
    return {
      raw: failureAgeStore.majorFailuresShared,
      count: failureAgeStore.majorFailuresShared * 1,
    }
  })
  const lessonsLearnedTotal = computed(() => {
    return {
      raw: failureAgeStore.lessonsLearnedCount,
      count: failureAgeStore.lessonsLearnedCount * 0.5,
    }
  })
  const helpfulCommentsTotal = computed(() => {
    return {
      raw: failureAgeStore.helpfulCommentsCount,
      count: failureAgeStore.helpfulCommentsCount * 0.25,
    }
  })
  const unresolvedFailures = computed(() => {
    return {
      raw: failureAgeStore.unresolvedFailures,
      count: -failureAgeStore.unresolvedFailures * 0.1,
    }
  })

  const wisdomGap = computed(() => {
    return majorFailuresShared.value.count + lessonsLearnedTotal.value.count + helpfulCommentsTotal.value.count + unresolvedFailures.value.count
  })
  const totalAge = computed(() => {
    return actualAge.value + wisdomGap.value
  })
  const calculateProgress = computed(() => ((totalAge.value - actualAge.value) * 100) / (50 - actualAge.value))
</script>

<template>
  <div>
    <div class="ages-wrapper">
      <div class="d-flex align-center justify-center age-header">
        <h1>{{ useNumeral(totalAge) }}</h1>
        <p class="ml-2">years</p>
      </div>
      <v-progress-linear
        v-model="calculateProgress"
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
          <p>{{ actualAge }}</p>
        </div>
        <div class="d-flex flex-column px-13 border-left align-center">
          <div class="label">Wisdom Gap</div>
          <p>{{ useNumeral(wisdomGap) }}</p>
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
              <p class="text-description">{{ majorFailuresShared.raw }} x 1.0</p>
              <div class="result" style="color: #F3A412">+{{ useNumeral(majorFailuresShared.count) }}</div>
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
              <p class="text-description">{{ lessonsLearnedTotal.raw }} × 0.5</p>
              <div class="result" style="color: #31953A">+{{ useNumeral(lessonsLearnedTotal.count) }}</div>
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
              <p class="text-description">{{ helpfulCommentsTotal.raw }} × 0.25</p>
              <div class="result">+{{ useNumeral(helpfulCommentsTotal.count) }}</div>
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
              <p class="text-description">{{ unresolvedFailures.raw }} × 0.1</p>
              <div class="result" style="color: #C8372B">{{ useNumeral(unresolvedFailures.count) }}</div>
            </div>
          </li>
        </ul>
      </div>
    </v-expand-transition>
  </div>
</template>
