<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import { watch } from 'vue'
  import DatePickerInput from '@/components/DatePickerInput.vue'
  import FormInput from '@/components/FormInput.vue'
  import UploadFile from '@/components/UploadFile.vue'
  import { useCreatePostStore } from '@/stores/create-post'
  import { stripHtml } from '@/utils/html.js'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/components/create-post/step-two.scss'

  const store = useCreatePostStore()
  const inputLength = 100
  const quillLength = 5000

  // Handler to limit text length
  function handleTextChange (value, key) {
    if (stripHtml(value).length >= quillLength) {
      store.stepTwo[key] = value.slice(0, quillLength)
    }
  }

  const emit = defineEmits(['isValid'])
  watch(() => store.stepTwo, value => {
    if (value.title && (value.description && value.description !== '<p><br></p>') && value.date) {
      // eslint-disable-next-line vue/custom-event-name-casing
      emit('isValid', true)
    } else emit(
      // eslint-disable-next-line vue/custom-event-name-casing
      'isValid',
      false,
    )
  }, { deep: true, immediate: true })

</script>

<template>
  <div class="step-two">
    <h2 class="step-title">Failure Details</h2>
    <p class="step-subtitle">Tell us what happened</p>
    <div class="label">Images</div>
    <UploadFile
      v-model="store.stepTwo.images"
      class="mb-6"
      :max-files="3"
      multiple
      :quality="20"
    />
    <div class="form-group">
      <label class="form-label">Title <span class="text-error">*</span></label>
      <FormInput
        v-model="store.stepTwo.title"
        class="form-input"
        :counter="inputLength"
        hide-details="auto"
        :maxlength="inputLength"
        persistent-counter
        placeholder="A brief, clear description of what happened"
      />
    </div>
    <div class="form-group">
      <label class="form-label">What happened? <span class="text-error">*</span></label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepTwo.description"
          content-type="html"
          placeholder="Describe the situation in detail..."
          theme="snow"
          @text-change="handleTextChange(store.stepTwo.description, 'description')"
        />
        <div class="char-counter">{{ stripHtml(store.stepTwo.description).length }}/{{ quillLength }}</div>
      </div>
    </div>
    <div class="form-group mt-6">
      <label class="form-label">What went wrong?</label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepTwo.whatWentWrong"
          content-type="html"
          placeholder="What factors contributed to the failure?"
          theme="snow"
          @text-change="handleTextChange(store.stepTwo.whatWentWrong, 'whatWentWrong')"
        />
        <div class="char-counter">{{ stripHtml(store.stepTwo.whatWentWrong).length }}/{{ quillLength }}</div>
      </div>
    </div>
    <div class="form-group mt-6">
      <label class="form-label">How did it feel?</label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepTwo.howDidItFeel"
          content-type="html"
          placeholder="Describe your emotional experience..."
          theme="snow"
          @text-change="handleTextChange(store.stepTwo.howDidItFeel, 'howDidItFeel')"
        />
        <div class="char-counter">{{ stripHtml(store.stepTwo.howDidItFeel).length }}/{{ quillLength }}</div>
      </div>
    </div>

    <div class="form-group mt-6">
      <label class="form-label">When did it happen? <span class="text-error">*</span></label>
      <DatePickerInput
        v-model="store.stepTwo.date"
        :enable-time="false"
        :max-date="new Date()"
        placeholder="Select date"
      />
    </div>

  </div>
</template>

<style scoped>
.editor-wrapper {
  position: relative;
}

.char-counter {
  position: absolute;
  bottom: 2px;
  right: 12px;
  font-size: 12px;
  color: #888;
  z-index: 1;
  pointer-events: none;
}

.editor-wrapper :deep(.ql-editor) {
  padding-bottom: 30px;
}
</style>
