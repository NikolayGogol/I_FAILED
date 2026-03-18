<script setup>
  import { ref } from 'vue'
  import '@/styles/components/mobile-slide.scss'

  defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const startY = ref(0)
  const currentY = ref(0)
  const isDragging = ref(false)

  function close () {
    emit('update:modelValue', false)
  }

  function onTouchStart (e) {
    startY.value = e.touches[0].clientY
    isDragging.value = true
  }

  function onTouchMove (e) {
    if (!isDragging.value) return

    const delta = e.touches[0].clientY - startY.value
    // Дозволяємо тягнути тільки вниз
    if (delta > 0) {
      currentY.value = delta
    }
  }

  function onTouchEnd () {
    if (!isDragging.value) return
    isDragging.value = false

    // Якщо потягнули вниз більше ніж на 50px, то закриваємо
    if (currentY.value > 50) {
      close()
    }

    // Скидаємо позицію
    currentY.value = 0
  }
</script>

<template>
  <Transition name="mobile-slide">
    <div v-if="modelValue" class="mobile-slide-wrapper" @click.self="close">
      <div
        class="drawer-content"
        :style="{
          transform: currentY > 0 ? `translateY(${currentY}px)` : '',
          transition: isDragging ? 'none' : ''
        }"
      >
        <div
          class="line"
          @touchend="onTouchEnd"
          @touchmove.prevent="onTouchMove"
          @touchstart="onTouchStart"
        />
        <slot />
      </div>
    </div>
  </Transition>
</template>
