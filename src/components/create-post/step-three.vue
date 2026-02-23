<script setup>
  import { QuillEditor } from '@vueup/vue-quill'
  import FormInput from '@/components/FormInput.vue'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-three.scss'

  const store = useCreatePostStore()
</script>

<template>
  <div class="step-three">
    <h2 class="step-title">Lesson learned</h2>
    <p class="step-subtitle">Share what you learned from this experience</p>

    <div class="form-group">
      <label class="form-label">What I learned *</label>
      <FormInput
        v-model="store.stepThree.whatILearned"
        class="form-input"
        maxlength="100"
        persistent-counter
        placeholder="A brief, clear description of what happened"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Key takeaways</label>
      <QuillEditor v-model:content="store.stepThree.keyTakeaways" content-type="html" theme="snow" />
    </div>
    <div class="form-group">
      <label class="form-label">What I'd do differently</label>
      <QuillEditor v-model:content="store.stepThree.whatIdDoDifferently" content-type="html" theme="snow" />
    </div>
    <div class="form-group">
      <label class="form-label">Advice for others</label>
      <QuillEditor v-model:content="store.stepThree.advice" content-type="html" theme="snow" />
    </div>
  </div>
</template>
