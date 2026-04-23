<script setup>
import { onMounted } from 'vue'
import { useActivityStore } from '@/stores/settings/activity'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['back'])
const radios = [
  {
    label: 'All users',
    value: 'all',
  },
  {
    label: 'Followers only',
    value: 'followers',
  },
  {
    label: 'Nobody',
    value: 'nobody',
  },
]

const activityStore = useActivityStore()
const { selectedLikes, selectedComments } = storeToRefs(activityStore)

onMounted(() => {
  activityStore.initializeActivitySettings()
})

</script>

<template>
  <div class="notify-tab">
    <div class="d-flex tab-header" @click="emit('back')">
      <v-icon class="mr-6" icon="mdi-chevron-left" />
      <span>Activity visibility</span>
    </div>
    <h3 class="font-weight-bold mt-4">Who can see my likes?</h3>
    <v-radio-group
      v-model="selectedLikes"
      @update:modelValue="activityStore.updateLikesVisibility"
      color="primary"
      hide-details
    >
      <v-radio
        v-for="radio in radios"
        :key="radio.value"
        :label="radio.label"
        :value="radio.value"
      />
    </v-radio-group>
    <h3 class="font-weight-bold mt-4">Who can see my comments?</h3>
    <v-radio-group
      v-model="selectedComments"
      @update:modelValue="activityStore.updateCommentsVisibility"
      color="primary"
      hide-details
    >
      <v-radio
        v-for="radio in radios"
        :key="radio.value"
        :label="radio.label"
        :value="radio.value"
      />
    </v-radio-group>
  </div>
</template>
