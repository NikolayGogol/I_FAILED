<script setup>
  import { ref, watch } from 'vue'
  import DatePickerInput from '@/components/DatePickerInput.vue'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-five.scss'

  const store = useCreatePostStore()
  const emit = defineEmits(['isValid'])
  const triggerText = ref('')
  //
  function addTag () {
    store.stepFive.triggerTags.push(triggerText.value)
    triggerText.value = ''
  }
  function removeTag (index) {
    store.stepFive.triggerTags.splice(index, 1)
  }
  watch(() => store.stepFive, val => {
    if (val.enableTriggerWarning && store.stepFive.triggerTags.length === 0) {
      // eslint-disable-next-line vue/custom-event-name-casing
      emit('isValid', false)
    } else {
      // eslint-disable-next-line vue/custom-event-name-casing
      emit('isValid', true)
    }
  }, { immediate: true, deep: true })
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
    <div v-if="store.stepFive.enableTriggerWarning" class="mt-2">
      <label for="">Trigger Warning</label>
      <div class="d-flex">
        <form-input
          v-model="triggerText"
          hide-details
          placeholder="e.g., Financial loss, Mental health"
          @keydown.enter.prevent="addTag()"
        />
        <div class="cancel-btn" @click="addTag">Add</div>
      </div>
      <ul class="selected-tags-list mt-2 ga-2">
        <li v-for="(tag, index) in store.stepFive.triggerTags" :key="tag" class="tag-chip py-1 px-2">
          {{ tag }}
          <span class="remove-tag cursor-pointer" @click="removeTag(index)">×</span>
        </li>
      </ul>
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
