<script setup>
  import Compressor from 'compressorjs'
  import { ref, watch } from 'vue'
  import { useToast } from 'vue-toastification'
  import '@/styles/components/upload-file.scss'

  const toast = useToast()

  const props = defineProps({
    modelValue: {
      type: [Array, Object, null],
      default: () => [],
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    quality: {
      type: Number,
      default: 80, // Default quality 80%
      validator: value => value > 0 && value <= 100,
    },
  })

  const emit = defineEmits(['update:modelValue'])

  const previewItems = ref([])

  // Helper to format file size
  function formatSize (bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Watch for external changes to modelValue
  watch(() => props.modelValue, newVal => {
    if (!newVal || (Array.isArray(newVal) && newVal.length === 0)) {
      previewItems.value = []
      return
    }

    const files = Array.isArray(newVal) ? newVal : [newVal]
    previewItems.value = files.map(item => {
      // If it's our custom object structure
      if (item.file instanceof File) {
        return {
          url: URL.createObjectURL(item.file),
          size: formatSize(item.size),
        }
      }
      // Fallback for direct File objects (though we should be emitting objects now)
      if (item instanceof File) {
        return {
          url: URL.createObjectURL(item),
          size: formatSize(item.size),
        }
      }
      // If it's just a URL string or unknown structure
      return {
        url: item.url || item,
        size: item.size > 0 ? formatSize(item.size) : '',
      }
    })
  }, { immediate: true })

  function compressImage (file) {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: props.quality / 100,
        success (result) {
          // Create a new File object from the Blob result
          const compressedFile = new File([result], file.name, {
            type: result.type,
            lastModified: Date.now(),
          })

          // Create the requested object structure
          const fileObject = {
            name: compressedFile.name,
            size: compressedFile.size,
            file: compressedFile,
            type: compressedFile.type,
            format: compressedFile.type.split('/')[1] || '',
          }

          resolve(fileObject)
        },
        error (err) {
          reject(err)
        },
      })
    })
  }

  async function onFileChange (event) {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      try {
        // Compress files and get formatted objects
        const processedFiles = await Promise.all(files.map(file => compressImage(file)))

        if (props.multiple) {
          const currentFiles = props.modelValue || []
          const newFiles = []
          let duplicateCount = 0

          for (const newFileObj of processedFiles) {
            // Check for duplicates based on name and type
            const isDuplicate = currentFiles.some(existingItem => {
              // Handle both our object structure and potential raw File objects if mixed
              const existingName = existingItem.name || existingItem.file?.name || existingItem.name
              const existingType = existingItem.type || existingItem.file?.type || existingItem.type

              return existingName === newFileObj.name && existingType === newFileObj.type
            })

            if (isDuplicate) {
              duplicateCount++
            } else {
              newFiles.push(newFileObj)
            }
          }

          if (duplicateCount > 0) {
            toast.warning(`${duplicateCount} duplicate image${duplicateCount > 1 ? 's' : ''} skipped`)
          }

          if (newFiles.length > 0) {
            emit('update:modelValue', [...currentFiles, ...newFiles])
          }
        } else {
          emit('update:modelValue', processedFiles[0])
        }
      } catch (error) {
        console.error('Compression error:', error)
        toast.error('Failed to process images')
      }
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  function removeImage (index) {
    if (props.multiple) {
      const newFiles = [...props.modelValue]
      newFiles.splice(index, 1)
      emit('update:modelValue', newFiles)
    } else {
      emit('update:modelValue', null)
    }
  }
</script>

<template>
  <div class="upload-file-wrapper" :class="{ 'has-files': previewItems.length > 0 }">
    <v-container v-if="previewItems.length > 0" class="fill-height pa-3 overflow-y-auto" fluid>
      <v-row :class="{ 'fill-height': !multiple }" dense>
        <v-col
          v-for="(item, index) in previewItems"
          :key="index"
          :cols="multiple ? 'auto' : 12"
        >
          <v-card
            border
            :class="['preview-card', { 'fill-height': !multiple }]"
            flat
            :height="multiple ? 100 : '100%'"
            :width="multiple ? 100 : '100%'"
          >
            <v-img class="fill-height" cover :src="item.url">
              <div class="image-size-badge">
                {{ item.size }}
              </div>
            </v-img>
            <v-btn
              class="remove-btn"
              color="white"
              icon="mdi-close"
              size="x-small"
              variant="flat"
              @click.stop="removeImage(index)"
            />
          </v-card>
        </v-col>

        <v-col v-if="multiple" cols="auto">
          <label
            class="add-more-btn d-flex flex-column align-center justify-center cursor-pointer"
            for="input-file-add"
          >
            <v-icon icon="mdi-plus" size="large" />
            <span>Add</span>
          </label>
        </v-col>
      </v-row>
    </v-container>

    <div v-else class="d-flex flex-column align-center justify-center cursor-pointer full-height">
      <v-icon class="mb-3" color="primary" icon="mdi-camera-outline" size="48" />
      <span class="text-body-1 font-weight-medium upload-title">Upload images</span>
      <p class="text-caption text-medium-emphasis upload-sub-title">You can upload max 3 photos</p>
      <label class="upload-btn rounded-lg font-weight-semibold" for="input-file">+ Upload image</label>
    </div>
    <input
      id="input-file"
      :accept="'image/*'"
      class="d-none"
      :multiple="multiple"
      type="file"
      @change="onFileChange"
    >
    <input
      v-if="multiple"
      id="input-file-add"
      :accept="'image/*'"
      class="d-none"
      multiple
      type="file"
      @change="onFileChange"
    >
  </div>
</template>

<style scoped>
.upload-file-wrapper {
  overflow: hidden; /* Ensure content doesn't spill out */
}

.full-height {
  height: 100%;
  width: 100%;
}

.preview-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.6) !important;
  color: white !important;
  border-radius: 50%;
}

.remove-btn:hover {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

.image-size-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  pointer-events: none;
}

.add-more-btn {
  width: 100px;
  height: 100px;
  border: 1px dashed #cecece;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s;
  background-color: #f8fafc;
}

.add-more-btn:hover {
  border-color: var(--v-theme-primary);
  color: var(--v-theme-primary);
  background-color: #f1f5f9;
}
</style>
