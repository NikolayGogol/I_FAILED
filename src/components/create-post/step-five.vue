<script setup>
  import DatePickerInput from '@/components/DatePickerInput.vue'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-five.scss'

  const store = useCreatePostStore()
  const emit = defineEmits(['isValid'])
  //
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('isValid', true)

</script>

<template>
  <div class="step-five">
    <h2 class="step-title">Privacy & Posting</h2>

    <div class="setting-row ">
      <div>
        <div class="setting-title">Post as Anonymous</div>
        <div class="setting-desc">Hide your identity on this post</div>
      </div>
      <v-switch
        v-model="store.stepFive.isAnonymous"
        color="primary"
        density="compact"
        hide-details
        inset
      />
    </div>

    <div class="form-group my-4">
      <label class="form-label mt-1">Visibility</label>
      <v-select
        v-model="store.stepFive.visibility"
        class="form-input form-field select"
        color="primary"
        hide-details
        :items="['Public', 'Followers Only', 'Private']"
        placeholder="Choose an option"
        variant="outlined"
      />
    </div>

    <div class="setting-row">
      <div class="setting-title">Allow comments</div>
      <v-switch
        v-model="store.stepFive.allowComments"
        color="primary"
        density="compact"
        hide-details
        inset
      />
    </div>

    <div class="setting-row mt-4">
      <div class="setting-title">Enable trigger warning</div>
      <v-switch
        v-model="store.stepFive.enableTriggerWarning"
        color="primary"
        density="compact"
        hide-details
        inset
      />
    </div>

    <div class="form-group mt-6">
      <label class="form-label">Schedule post (optional)</label>
      <DatePickerInput
        v-model="store.stepFive.scheduleDate"
        class="date-picker mt-1"
        enable-time
        :min-date="new Date()"
        :minutes-grid-step="10"
        :minutes-increment="10"
        placeholder="Select date and time"
      />
    </div>
  </div>
</template>
