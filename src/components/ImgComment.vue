<script setup>
  import { nextTick, onMounted, ref, watch } from 'vue'
  import { getIcon } from '@/models/icons.js'

  // Define component props
  const props = defineProps({
    // The v-model value, can be a File, an object with a URL, or an array of these.
    modelValue: {
      type: [Object, File, Array],
      default: null,
    },
    // Maximum number of files allowed.
    maxFiles: {
      type: Number,
      default: 1,
    },
    // A CSS selector for the teleport target.
    teleportTo: {
      type: String,
      default: null,
    },
  })

  // Define component emits
  const emit = defineEmits(['update:modelValue'])

  // Reactive references
  const imagePreviews = ref([]) // Holds data URLs for image previews
  const inputRef = ref(null) // Reference to the hidden file input
  const targetReady = ref(false) // Becomes true when the teleport target is available in the DOM

  // Check for the teleport target once the component is mounted
  onMounted(() => {
    if (props.teleportTo) {
      // Use nextTick to ensure the parent component's DOM has been updated
      nextTick(() => {
        if (document.querySelector(props.teleportTo)) {
          targetReady.value = true
        }
      })
    }
  })

  // Watch for changes in the modelValue to update previews
  watch(() => props.modelValue, newValue => {
    imagePreviews.value = []
    if (!newValue) return

    const filesArray = Array.isArray(newValue) ? newValue : [newValue]
    for (const fileOrObject of filesArray) {
      // If it's a File object, read it to generate a preview
      if (fileOrObject instanceof File) {
        const reader = new FileReader()
        reader.addEventListener('load', e => {
          if (!imagePreviews.value.includes(e.target.result)) {
            imagePreviews.value.push(e.target.result)
          }
        })
        reader.readAsDataURL(fileOrObject)
        // If it's an object with a URL (for existing images), use the URL directly
      } else if (fileOrObject && fileOrObject.url && !imagePreviews.value.includes(fileOrObject.url)) {
        imagePreviews.value.push(fileOrObject.url)
      }
    }
  }, { immediate: true, deep: true })

  /**
   * Handles the file input change event.
   * @param {Event} e - The change event object.
   */
  function onFileChange (e) {
    const selectedFile = e.target.files[0]
    e.target.value = '' // Reset input to allow selecting the same file again
    if (!selectedFile) return

    // Validate file type
    if (selectedFile.type.startsWith('image/') && selectedFile.type !== 'image/svg+xml') {
      emit('update:modelValue', selectedFile)
    } else {
      alert('Please select a valid image file (JPEG, PNG, GIF, etc.). SVG is not supported.')
    }
  }

  // Programmatically clicks the hidden file input
  function openFileDialog () {
    inputRef.value.click()
  }

  // Emits a null value to remove the image
  function removeImage () {
    emit('update:modelValue', null)
  }
</script>

<template>
  <div>
    <!-- Hidden file input -->
    <input
      ref="inputRef"
      accept="image/png, image/jpeg, image/gif, image/bmp, image/webp"
      :multiple="maxFiles > 1"
      style="display: none"
      type="file"
      @change="onFileChange"
    >
    <!-- The visible icon that triggers the file dialog -->
    <div class="d-flex cursor-pointer mr-2" @click="openFileDialog" v-html="getIcon('image')" />

    <!-- Teleport the preview to the target element if `teleportTo` is provided and the target is ready -->
    <Teleport v-if="targetReady && teleportTo" :to="teleportTo">
      <div v-if="imagePreviews.length > 0" class="d-flex flex-wrap mt-2">
        <div v-for="(src, index) in imagePreviews" :key="index" class="position-relative mr-2 mb-2">
          <v-img
            class="rounded-lg"
            cover
            height="80"
            :src="src"
            width="80"
          />
          <v-btn class="position-absolute top-0 right-0" icon="mdi-close" size="x-small" @click="removeImage(index)" />
        </div>
      </div>
    </Teleport>

    <!-- Fallback: Render the preview inside the component if `teleportTo` is not used -->
    <div v-else-if="!teleportTo">
      <div v-if="imagePreviews.length > 0" class="d-flex flex-wrap mt-2">
        <div v-for="(src, index) in imagePreviews" :key="index" class="position-relative mr-2 mb-2">
          <v-img
            class="rounded-lg"
            cover
            height="80"
            :src="src"
            width="80"
          />
          <v-btn class="position-absolute top-0 right-0" icon="mdi-close" size="x-small" @click="removeImage(index)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.position-relative {
  position: relative;
}
.top-0 {
  top: -10px;
}
.right-0 {
  right: -10px;
}
</style>
