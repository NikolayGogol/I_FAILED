<script setup>

  import { computed, onMounted, ref } from 'vue'
  import DatePickerInput from '@/components/DatePickerInput.vue'
  import FormInput from '@/components/FormInput.vue'
  import { visibilityList } from '@/models/categories.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { useProfileStore } from '@/stores/profile/profile.js'
  import { isPremium } from '@/utils/premium.js'
  //
  const store = useCreatePostStore()
  const triggerText = ref('')
  const currentDate = computed(() => new Date())
  const { fetchUserPosts } = useProfileStore()
  const authStore = useAuthStore()
  const isAnonymousCounter = ref(0)
  //
  onMounted(() => {
    if (authStore.user?.uid) {
      fetchUserPosts(authStore.user.uid)
        .then(posts => {
          isAnonymousCounter.value = posts.filter(post => post.isAnonymous).length
        })
    }
  })
  //
  function addTag () {
    if (triggerText.value && !store.triggerTags.includes(triggerText.value)) {
      store.triggerTags.push(triggerText.value)
    }
    triggerText.value = ''
  }

  function removeTag (index) {
    store.triggerTags.splice(index, 1)
  }
  const anonymousPost = computed(() => {
    return isPremium.value ? false : isAnonymousCounter.value >= 3
  })
</script>

<template>
  <h5 class="mt-6">Privacy & Posting</h5>
  <div class="setting-row mt-6">
    <div>
      <div class="setting-title">Post as Anonymous</div>
      <div class="setting-desc">Hide your identity on this post</div>
    </div>
    <v-switch
      v-model="store.isAnonymous"
      color="primary"
      density="compact"
      :disabled="anonymousPost"
      hide-details
      inset
      :readonly="anonymousPost"
    />
  </div>
  <div v-if="!isPremium" class="d-flex align-center justify-space-between mt-2">
    <span class="text-description fs-12">
      <b class="text-grey-darken-3">{{ isAnonymousCounter }}/3</b>
      anonymous posts left
    </span>
    <router-link class="text-primary fs-14" to="/premium">Buy premium</router-link>
  </div>
  <div class="form-group my-4">
    <label class="form-label mt-1">Visibility</label>
    <v-select
      v-model="store.visibility"
      class="form-field form-select"
      color="primary"
      hide-details
      item-title="label"
      :items="visibilityList"
      placeholder="Choose an option"
      return-object
      variant="outlined"
    />
  </div>
  <div class="setting-row">
    <div class="setting-title">Allow comments</div>
    <v-switch
      v-model="store.allowComments"
      color="primary"
      density="compact"
      hide-details
      inset
    />
  </div>
  <div class="setting-row mt-4">
    <div class="setting-title">Enable trigger warning</div>
    <v-switch
      v-model="store.enableTriggerWarning"
      color="primary"
      density="compact"
      hide-details
      inset
    />
  </div>
  <div v-if="store.enableTriggerWarning" class="mt-2">
    <label for="">Trigger Warning</label>
    <div class="d-flex">
      <form-input
        v-model="triggerText"
        hide-details
        placeholder="e.g., Financial loss, Mental health"
        @keydown.enter.prevent="addTag()"
      />
      <div class="cancel-btn ml-6" @click="addTag">Add</div>
    </div>
    <ul class="selected-tags-list mt-2 ga-2">
      <li v-for="(tag, index) in store.triggerTags" :key="tag" class="tag-chip py-1 px-2">
        {{ tag }}
        <span class="remove-tag cursor-pointer" @click="removeTag(index)">×</span>
      </li>
    </ul>
  </div>
  <div class="form-group mt-6">
    <label class="form-label">Schedule post (optional)</label>
    <DatePickerInput
      v-model="store.scheduleDate"
      class="date-picker mt-1"
      enable-time
      :min-date="currentDate"
      placeholder="Select date"
    />
  </div>
</template>
