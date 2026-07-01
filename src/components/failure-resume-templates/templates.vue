<script setup>
  import { defineAsyncComponent, shallowRef } from 'vue'
  import { useAuthStore } from '@/stores/auth.js'
  import defaultTemplate from '../../assets/templates/defaultTemplate.jpg'
  import ForestThumbnail from '../../assets/templates/ForestThumbnail.jpg'
  import MidnightThumbnail from '../../assets/templates/MidnightThumbnail.jpg'
  import RoseGoldThumbnail from '../../assets/templates/RoseGoldThumbnail.jpg'
  import Slate from '../../assets/templates/Slate.jpg'
  import '@/styles/components/failure-resume-templates/templates.scss'
  //
  const user = useAuthStore().user
  const emit = defineEmits(['template-update'])
  defineProps({
    isExporting: {
      type: Boolean,
      default: false,
    },
  })
  const templatesList = [
    {
      value: 0,
      label: 'Default',
      img: defaultTemplate,
      component: defineAsyncComponent(() => import('./defaultTemp.vue')),
    },
    {
      value: 1,
      label: 'Rose Gold',
      img: RoseGoldThumbnail,
      component: defineAsyncComponent(() => import('./roseTemp.vue')),
    },
    {
      value: 2,
      label: 'Midnight',
      img: MidnightThumbnail,
      component: defineAsyncComponent(() => import('./midnightTemp.vue')),
    },
    {
      value: 3,
      label: 'Forest',
      img: ForestThumbnail,
      component: defineAsyncComponent(() => import('./forestTemp.vue')),
    },
    {
      value: 4,
      label: 'Slate',
      img: Slate,
      component: defineAsyncComponent(() => import('./slateTemp.vue')),
    },
  ]
  const selectedTemplate = shallowRef(null)
  //
  function selectTemplate (item) {
    selectedTemplate.value = item
    emit('template-update', item)
  }
</script>

<template>
  <div class="templates-wrapper">
    <div class="header">
      <h5 class="font-weight-semibold fs-18 text-grey-darken-3">Resume templates</h5>
      <p class="text-description">Choose a template to get personalised resume</p>
    </div>
    <ul class="ga-2">
      <li
        v-for="(item, index) in templatesList"
        :key="index"
        :class="{'active': selectedTemplate?.value === item.value}"
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
      :display-name="user.displayName"
      :user-name="user.userName"
    />
  </div>
</template>
