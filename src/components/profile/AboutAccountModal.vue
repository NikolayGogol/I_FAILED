<script setup>
  import dayjs from 'dayjs'
  import { computed } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import '@/styles/components/profile/about-account-modal.scss'

  const props = defineProps({
    modelValue: Boolean,
    user: {
      type: Object,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const dialog = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const displayName = computed(() => props.user?.displayName || 'User')
  const username = computed(() => displayName.value.replaceAll(' ', '_'))
  const photoURL = computed(() => props.user?.photoURL)
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + (parts[1]?.charAt(0) || '')).toUpperCase()
  })

  const joinDate = computed(() => {
    if (props.user?.createdAt) {
      const seconds = props.user.createdAt.seconds
      if (seconds) {
        return dayjs.unix(seconds).format('MMMM YYYY')
      }
      return dayjs(props.user.createdAt).format('MMMM YYYY')
    }
    return 'Unknown'
  })
</script>

<template>
  <v-dialog v-model="dialog" class="about-account-dialog d-none d-sm-flex" max-width="600px">
    <v-card>
      <v-card-title>
        About account
      </v-card-title>
      <v-card-text>
        <div class="user-avatar">
          <v-img
            v-if="photoURL"
            alt="Profile"
            cover
            :src="photoURL"
          />
          <span v-else class="initials-span">{{ initials }}</span>
        </div>
        <h2>{{ displayName }}</h2>
        <p class="text-medium-emphasis">@{{ username }}</p>
      </v-card-text>
      <ul class="user-list mt-6">
        <li class="d-flex align-center">
          <div class="icon" v-html="getIcon('calendar')" />
          <div class="d-flex flex-column align-start ml-4">
            <h6>Joining date</h6>
            <p>{{ joinDate }}</p>
          </div>
        </li>
      </ul>
      <div class="cancel-btn" @click="dialog = false">Close</div>
    </v-card>
  </v-dialog>
  <MobileSlide v-model="dialog" class="about-account-dialog d-sm-none">
    <v-card class="elevation-0">
      <v-card-title>
        About account
      </v-card-title>
      <v-card-text>
        <div class="user-avatar">
          <v-img
            v-if="photoURL"
            alt="Profile"
            cover
            :src="photoURL"
          />
          <span v-else class="initials-span">{{ initials }}</span>
        </div>
        <h2>{{ displayName }}</h2>
        <p class="text-medium-emphasis">@{{ username }}</p>
      </v-card-text>
      <ul class="user-list mt-6">
        <li class="d-flex align-center">
          <div class="icon" v-html="getIcon('calendar')" />
          <div class="d-flex flex-column align-start ml-4">
            <h6>Joining date</h6>
            <p>{{ joinDate }}</p>
          </div>
        </li>
      </ul>
      <div class="cancel-btn" @click="dialog = false">Close</div>
    </v-card>
  </MobileSlide>
</template>
