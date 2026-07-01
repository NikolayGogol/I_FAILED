<script setup>
  import { defineAsyncComponent, shallowRef, computed, onMounted, watch } from 'vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { isPremium } from '@/utils/premium.js'
  import defaultTemplate from '../../assets/templates/defaultTemplate.jpg'
  import ForestThumbnail from '../../assets/templates/ForestThumbnail.jpg'
  import MidnightThumbnail from '../../assets/templates/MidnightThumbnail.jpg'
  import RoseGoldThumbnail from '../../assets/templates/RoseGoldThumbnail.jpg'
  import Slate from '../../assets/templates/Slate.jpg'
  import '@/styles/components/failure-resume-templates/templates.scss'
  //
  const user = useAuthStore().user
  const emit = defineEmits(['template-update'])
  const props = defineProps({
    isExporting: {
      type: Boolean,
      default: false,
    },
    initialTemplate: {
      type: [Number, String],
      default: null,
    },
    displayUser: {
      type: Object,
      default: () => null,
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  })

  const activeUser = computed(() => props.displayUser || user)
  const templatesList = [
    {
      value: 0,
      label: 'Default',
      img: defaultTemplate,
      component: defineAsyncComponent(() => import('./defaultTemp.vue')),
      disabled: false,
    },
    {
      value: 1,
      label: 'Rose Gold',
      img: RoseGoldThumbnail,
      component: defineAsyncComponent(() => import('./roseTemp.vue')),
      disabled: !isPremium.value,
    },
    {
      value: 2,
      label: 'Midnight',
      img: MidnightThumbnail,
      component: defineAsyncComponent(() => import('./midnightTemp.vue')),
      disabled: !isPremium.value,
    },
    {
      value: 3,
      label: 'Forest',
      img: ForestThumbnail,
      component: defineAsyncComponent(() => import('./forestTemp.vue')),
      disabled: !isPremium.value,
    },
    {
      value: 4,
      label: 'Slate',
      img: Slate,
      component: defineAsyncComponent(() => import('./slateTemp.vue')),
      disabled: !isPremium.value,
    },
  ]
  const selectedTemplate = shallowRef(null)
  //
  function selectTemplate (item) {
    if (item.disabled) return
    selectedTemplate.value = item
    emit('template-update', item)
  }

  onMounted(() => {
    if (props.initialTemplate !== null) {
      const template = templatesList.find(t => t.value == props.initialTemplate)
      if (template) {
        selectedTemplate.value = template
        emit('template-update', template)
      }
    }
  })

  watch(() => props.initialTemplate, (newVal) => {
    if (newVal !== null) {
      const template = templatesList.find(t => t.value == newVal)
      if (template) {
        selectedTemplate.value = template
        emit('template-update', template)
      }
    }
  })
</script>

<template>
  <div v-if="!readOnly" class="templates-wrapper">
    <div class="header">
      <h5 class="font-weight-semibold fs-18 text-grey-darken-3">Resume templates</h5>
      <p class="text-description">Choose a template to get personalised resume</p>
    </div>
    <ul class="ga-2">
      <li
        v-for="(item, index) in templatesList"
        :key="index"
        :class="[
          {'active': selectedTemplate?.value === item.value},
          {'disabled': item.disabled}
        ]"
        @click="selectTemplate(item)"
      >
        <div class="d-block">
          <img alt="" :src="item.img">
          <div class="name">{{ item.label }}</div>
        </div>
      </li>
    </ul>
  </div>
  <div v-if="selectedTemplate" class="bg">
    <component
      :is="selectedTemplate.component"
      :display-name="activeUser?.displayName"
      :user-name="activeUser?.userName"
    />
  </div>
</template>
