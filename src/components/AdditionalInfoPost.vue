<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import { onMounted } from 'vue'
  import { emotionTags } from '@/models/categories.js'
  import { useCreatePostStore } from '@/stores/create-post.js'
  import { stripHtml } from '@/utils/html.js'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  //
  const store = useCreatePostStore()
  const quillLength = 5000
  //
  onMounted(() => {
    store.fetchSuggestedTags()
  })
  function handleTextChange (value, key) {
    if (stripHtml(value).length >= quillLength) {
      store[key] = value.slice(0, quillLength)
    }
  }
  function handleEmotionChange (val) {
    if (val.length > 3) {
      // Remove the last added item if more than 3 are selected
      store.emotionTags = val.slice(0, 3)
      toast.warning('You can choose max 3 emotion tags')
    }
  }
</script>

<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-title>Additional Information</v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="form-group">
          <div class="label">Images</div>
          <UploadFile
            v-model="store.images"
            class="mb-6"
            :max-files="3"
            multiple
            :quality="20"
          />
        </div>
        <div class="form-group mt-6">
          <label class="form-label">What went wrong?</label>
          <div class="editor-wrapper">
            <QuillEditor
              v-model:content="store.whatWentWrong"
              content-type="html"
              placeholder="What factors contributed to the failure?"
              theme="snow"
              @text-change="handleTextChange(store.whatWentWrong, 'whatWentWrong')"
            />
            <div class="char-counter">{{ stripHtml(store.whatWentWrong).length }}/{{ quillLength }}</div>
          </div>
        </div>
        <div class="form-group mt-6">
          <label class="form-label">How did it feel?</label>
          <div class="editor-wrapper">
            <QuillEditor
              v-model:content="store.howDidItFeel"
              content-type="html"
              placeholder="Describe your emotional experience..."
              theme="snow"
              @text-change="handleTextChange(store.howDidItFeel, 'howDidItFeel')"
            />
            <div class="char-counter">{{ stripHtml(store.howDidItFeel).length }}/{{ quillLength }}</div>
          </div>
        </div>
        <div class="form-group mt-6">
          <label class="form-label">When did it happen?</label>
          <DatePickerInput
            v-model="store.whenHappened"
            :enable-time="false"
            :max-date="new Date()"
            placeholder="Select date"
          />
        </div>
        <div class="form-group mt-6">
          <label class="form-label">Emotion Tags</label>
          <p class="form-hint">You can choose max 3 tags</p>
          <v-chip-group
            v-model="store.emotionTags"
            class="emotion-tags"
            column
            filter
            multiple
            return-object
            @update:model-value="handleEmotionChange"
          >
            <v-chip
              v-for="tag in emotionTags"
              :key="tag.value"
              class="emotion-chip"
              color="primary"
              filter-icon="mdi-check"
              :value="tag"
              variant="outlined"
            >
              <span class="me-1">{{ tag.emoji }}</span> {{ tag.label }}
            </v-chip>
          </v-chip-group>
        </div>

        <div class="form-group mt-6">
          <label class="form-label">Tags</label>
          <FormAutocomplete
            v-model="store.tags"
            :options="store.suggestedTags"
            placeholder="Add tag"
          />
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped lang="scss">

</style>
