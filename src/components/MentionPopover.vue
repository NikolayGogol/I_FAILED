<script setup>
  import '@/styles/components/mention-popover.scss'

  defineProps({
    show: Boolean,
    position: Object,
    users: Array,
  })

  const emit = defineEmits(['select'])

  function selectUser (user) {
    emit('select', user)
  }
</script>

<template>
  <div v-if="show" class="mention-popover" :style="{ top: `${position.top}px`, left: `${position.left}px` }">
    <ul>
      <li
        v-for="user in users"
        :key="user.value"
        @click="selectUser(user)"
      >
        <img
          alt="avatar"
          class="avatar"
          :src="user.photoURL"
        >
        <span>{{ user.label }}</span>
      </li>
    </ul>
  </div>
</template>
