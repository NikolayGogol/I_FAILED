<script setup>
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import { QuillEditor } from '@vueup/vue-quill'
  import { watch } from 'vue'
  import DatePickerInput from '@/components/DatePickerInput.vue'
  import FormInput from '@/components/FormInput.vue'
  import UploadFile from '@/components/UploadFile.vue'
  import { useCreatePostStore } from '@/stores/create-post'
  import '@vueup/vue-quill/dist/vue-quill.snow.css'
  import '@/styles/components/form-input.scss'
  import '@/styles/components/create-post/step-two.scss'

  const store = useCreatePostStore()
  //
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
        hide-details="auto"
        maxlength="100"
        persistent-counter
        placeholder="A brief, clear description of what happened"
      />
    </div>

    <div class="form-group mt-6">
      <label class="form-label">What happened? <span class="text-error">*</span></label>
      <QuillEditor v-model:content="store.stepTwo.description" content-type="html" theme="snow" />
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
    <div class="form-group mt-6">
      <label class="form-label">What went wrong?</label>
      <QuillEditor v-model:content="store.stepTwo.whatWentWrong" content-type="html" theme="snow" />
    </div>
    <div class="form-group mt-6">
      <label class="form-label">How did it feel?</label>
      <QuillEditor v-model:content="store.stepTwo.howDidItFeel" content-type="html" theme="snow" />
    </div>
  </div>
</template>
