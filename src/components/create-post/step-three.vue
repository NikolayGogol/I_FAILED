<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import { watch } from 'vue'
  import FormInput from '@/components/FormInput.vue'
  import { useCreatePostStore } from '@/stores/create-post'
  import { stripHtml } from '@/utils/html.js'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-three.scss'

  const store = useCreatePostStore()
  const emit = defineEmits(['isValid'])
  const inputLength = 100
  const quillLength = 5000

  // Handler to limit text length
  function handleTextChange (value, key) {
    if (stripHtml(value).length >= quillLength) {
      store.stepThree[key] = value.slice(0, quillLength)
    }
  }

  watch(() => store.stepThree, value => {
    if (value.whatILearned) {
      // eslint-disable-next-line vue/custom-event-name-casing
      emit('isValid', true)
    } else {
      // eslint-disable-next-line vue/custom-event-name-casing
      emit('isValid', false)
    }
  }, { deep: true, immediate: true })
</script>

<template>
  <div class="step-three">
    <h2 class="step-title">Lesson learned</h2>
    <p class="step-subtitle">Share what you learned from this experience</p>

    <div class="form-group">
      <label class="form-label">What I learned <span class="text-error">*</span></label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepThree.whatILearned"
          content-type="html"
          placeholder="A brief, clear description of what happened"
          theme="snow"
          @text-change="handleTextChange(store.stepThree.whatILearned, 'whatILearned')"
        />
        <div class="char-counter">{{ stripHtml(store.stepThree.whatILearned).length }}/{{ quillLength }}</div>
      </div>
    </div>
    <div class="form-group mt-6">
      <label class="form-label">Key takeaways</label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepThree.keyTakeaways"
          content-type="html"
          placeholder="Describe the situation in detail..."
          theme="snow"
          @text-change="handleTextChange(store.stepThree.keyTakeaways, 'keyTakeaways')"
        />
        <div class="char-counter">{{ stripHtml(store.stepThree.keyTakeaways).length }}/{{ quillLength }}</div>
      </div>
    </div>
    <div class="form-group mt-6">
      <label class="form-label">What I'd do differently</label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepThree.whatIdDoDifferently"
          content-type="html"
          placeholder="Describe the situation in detail..."
          theme="snow"
          @text-change="handleTextChange(store.stepThree.whatIdDoDifferently, 'whatIdDoDifferently')"
        />
        <div class="char-counter">{{ stripHtml(store.stepThree.whatIdDoDifferently).length }}/{{ quillLength }}</div>
      </div>
    </div>
    <div class="form-group mt-6">
      <label class="form-label">Advice for others</label>
      <div class="editor-wrapper">
        <QuillEditor
          v-model:content="store.stepThree.advice"
          content-type="html"
          placeholder="Describe the situation in detail..."
          theme="snow"
          @text-change="handleTextChange(store.stepThree.advice, 'advice')"
        />
        <div class="char-counter">{{ stripHtml(store.stepThree.advice).length }}/{{ quillLength }}</div>
      </div>
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
