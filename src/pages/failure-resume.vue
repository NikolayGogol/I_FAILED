<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, nextTick, onBeforeMount, onMounted, provide, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'vue-toastification'
  import Templates from '@/components/failure-resume-templates/templates.vue'
  import { recoveryTimeOptions } from '@/models/categories.js'
  import { getIcon } from '@/models/icons.js'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile/profile.js'
  import { useUserStore } from '@/stores/user.js'
  import { floatNumber, formatNumber } from '../utils/format-number.js'
  import { lessonCounter } from '../utils/lesson-counter.js'
  import '@/styles/pages/failure-resume.scss'
  //
  const profileStore = useProfileStore()
  const auth = useAuthStore()
  const posts = ref([])
  const selectedPosts = ref([])
  const isExporting = ref(false)
  const postIsLoading = ref(false)
  const toggleUnpublish = ref(false)
  const templateSelected = ref(null)
  const toast = useToast()
  const { drafts } = storeToRefs(profileStore)
  const route = useRoute()
  const userStore = useUserStore()
  const initialTemplate = ref(null)
  const displayUser = ref(null)

  const isSharedView = computed(() => !!route.query.posts)

  const filteredPosts = computed(() => {
    if (isSharedView.value) {
      const postIds = new Set(route.query.posts.split(','))
      return posts.value.filter(p => postIds.has(p.id))
    }
    return posts.value
  })

  const filteredDrafts = computed(() => {
    if (isSharedView.value) {
      const postIds = new Set(route.query.posts.split(','))
      return drafts.value.filter(p => postIds.has(p.id))
    }
    return drafts.value
  })
  //
  onBeforeMount(() => {
    removeScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
  })
  onMounted(() => {
    postIsLoading.value = true
    let userId = auth.user.uid

    if (route.query.userId) {
      try {
        userId = atob(String(route.query.userId))
      } catch {
        userId = route.query.userId // fallback
      }
    }

    if (route.query.template !== undefined) {
      initialTemplate.value = Number(route.query.template)
    }

    if (userId === auth.user.uid) {
      displayUser.value = auth.user
    } else {
      userStore.getUserById(userId).then(user => {
        if (user) {
          displayUser.value = user
        }
      })
    }

    profileStore.fetchUserPosts(userId)
      .then(res => {
        posts.value = res
        if (route.query.posts) {
          const postIds = new Set(route.query.posts.split(','))
          const allPosts = [...posts.value, ...drafts.value]
          selectedPosts.value = allPosts.filter(post => postIds.has(post.id))
        }
      })
      .finally(() => {
        postIsLoading.value = false
      })
    addScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
  })
  provide('selectedPosts', selectedPosts)

  const lessonsLearned = computed(() => {
    const data = posts.value.filter(el => el.lessonLearned)
    let counter = 0
    for (const item of data) {
      counter += lessonCounter(item?.lessonLearned)
    }
    return counter
  })
  const totalCost = computed(() => {
    return posts.value.map(el => el.lessonLearned)
      .filter(Boolean)
      .map(el => el.cost)
      .reduce((a, b) => Number(a) + Number(b), 0)
  })
  const allSelected = computed(() => selectedPosts.value.length === posts.value.length && posts.value.length > 0)

  function selectAll () {
    selectedPosts.value = allSelected.value ? [] : [...filteredPosts.value, ...filteredDrafts.value]
  }

  const recoveryTime = computed(() => {
    const maxRecoveryDays = Math.max(...recoveryTimeOptions.map(opt => opt.days))
    const arr = posts.value.map(el => el.lessonLearned)
      .filter(Boolean)
    const lessonLearned = arr
      .filter(item => item?.recoveryTime)
      .map(el => el.recoveryTime?.days)
      .filter(Boolean)
    const daysCount = lessonLearned.reduce((acc, curr) => acc + curr, 0)
    const average = daysCount / lessonLearned.length
    if (average > 0) {
      return Math.round((average / maxRecoveryDays) * 100)
    }
    return 0
  })

  function addScript (url) {
    if (document.querySelector(`script[src="${url}"]`)) return
    const script = document.createElement('script')
    script.src = url
    document.head.append(script)
  }

  function removeScript (url) {
    const script = document.querySelector(`script[src="${url}"]`)
    if (script) {
      script.remove()
    }
  }

  async function exportToPDF () {
    if (isExporting.value) return
    isExporting.value = true

    // Fix for html2canvas blank page bug: scroll to top before capturing
    const currentScroll = window.scrollY
    window.scrollTo(0, 0)

    try {
      const res = selectedPosts.value
      if (!res || res.length === 0) {
        toast.error('Collection is empty')
        isExporting.value = false
        window.scrollTo(0, currentScroll)
        return
      }

      await nextTick()

      // Add a small delay to ensure all content (especially images) is rendered
      await new Promise(resolve => setTimeout(resolve, 1500))

      const exportWrapper = document.querySelector('.bg')

      // Temporarily add padding to prevent right-edge clipping by html2canvas scrollbar bug
      const originalPadding = exportWrapper.style.padding
      exportWrapper.style.padding = '20px'

      const opt = {
        margin: 0.5,
        filename: `Failure Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: document.documentElement.offsetWidth,
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['css', 'legacy'],
        },
      }

      html2pdf().from(exportWrapper).set(opt).save().then(() => {
        exportWrapper.style.padding = originalPadding
        toast.success('PDF generated')
        isExporting.value = false
        window.scrollTo(0, currentScroll)
      }).catch(error => {
        exportWrapper.style.padding = originalPadding
        console.error('PDF Export Error:', error)
        toast.error('Failed to generate PDF')
        isExporting.value = false
        window.scrollTo(0, currentScroll)
      })
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast.error('Failed to generate PDF')
      isExporting.value = false
      window.scrollTo(0, currentScroll)
    }
  }
  function generateSharableLink () {
    const query = new URLSearchParams()
    if (auth.user?.uid) {
      query.append('userId', btoa(auth.user.uid))
    }
    if (templateSelected.value) {
      query.append('template', templateSelected.value.value)
    }
    if (selectedPosts.value.length > 0) {
      const postIds = selectedPosts.value.map(p => p.id).join(',')
      query.append('posts', postIds)
    }
    const url = `${window.location.origin}/failure-resume?${query.toString()}`

    navigator.clipboard.writeText(url).then(() => {
      toast.success('Shareable link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }
</script>
<template>
  <div class="failure-resume-page">
    <div v-if="isExporting" class="overlay">
      <h3 class="mb-5">Generating PDF</h3>
      <v-progress-linear color="primary" indeterminate />
    </div>
    <div id="exporting-wrapper" />
    <div class="header">
      <h1>Failure Resume</h1>
      <p class="text-description fs-16">Transform your failures into a shareable resume of growth</p>
    </div>
    <div class="stat-panel mt-4">
      <v-row class="sm:ga-2 pa-6">
        <v-col cols="6" lg="3" sm="4">
          <div class="d-flex flex-column align-center justify-center item">
            <h2>{{ selectedPosts.length }}</h2>
            <p class="text-description">Failures Selected</p>
          </div>
        </v-col>
        <v-col cols="6" lg="3" sm="4">
          <div class="d-flex flex-column align-center justify-center item">
            <h2>{{ lessonsLearned }}</h2>
            <p class="text-description">Lessons Learned</p>
          </div>
        </v-col>
        <v-col cols="6" lg="3" sm="4">
          <div class="d-flex flex-column align-center justify-center item">
            <h2 class="text-uppercase">${{ floatNumber(totalCost) }}</h2>
            <p class="text-description">Total Cost</p>
          </div>
        </v-col>
        <v-col cols="6" lg="3" sm="4">
          <div class="d-flex flex-column align-center justify-center item">
            <h2 class="text-success">{{ recoveryTime }}%</h2>
            <p class="text-description">Recovery Rate</p>
          </div>
        </v-col>
      </v-row>
    </div>
    <v-progress-linear v-if="postIsLoading" class="mt-9" color="primary" indeterminate />
    <template v-else>
      <div class="main-content mt-4 pa-4">
        <div v-if="!isSharedView" class="d-flex justify-space-between mb-3">
          <h4>Select Failures to Include</h4>
          <p class="cursor-pointer text-primary fs-14" @click="selectAll">{{
            allSelected ? 'Deselect All' : 'Select All'
          }}</p>
        </div>
        <h4 v-else class="mb-3">Selected Failures</h4>
        <ul>
          <li
            v-for="post in filteredPosts"
            :key="post.id"
            :class="{selected: selectedPosts.some(p => p.id === post.id)}"
          >
            <div v-if="!isSharedView" class="d-block">
              <v-checkbox
                v-model="selectedPosts"
                color="primary"
                hide-details
                :value="post"
              />
            </div>
            <div class="d-flex flex-column align-start" :class="{'ml-6': !isSharedView}">
              <div class="tag">{{ post.selectedCategories[0].label }}</div>
              <div class="title">{{ post.title }}</div>
              <div v-if="post?.lessonLearned?.cost || post?.lessonLearned?.recoveryTime" class="item-panel">
                <div v-if="post?.lessonLearned?.cost">💰Cost: {{ formatNumber(post.lessonLearned.cost) }}</div>
                <div v-if="post?.lessonLearned?.recoveryTime" class="ml-4">⏱️Recovery:
                  {{ post.lessonLearned.recoveryTime.title }}
                </div>
                <div v-if="post?.lessonLearned?.recoveryTime" class="ml-4">📚 {{ lessonCounter(post.lessonLearned) }}
                  lessons
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div v-if="filteredDrafts.length > 0" class="unpublish-content main-content">
        <div class="d-flex align-center justify-space-between">
          <div class="d-block">
            <h5 class="font-weight-semibold fs-18 text-grey-darken-3">
              {{ isSharedView ? 'Unpublished Failures' : 'Add Unpublished Failures' }}
            </h5>
            <p v-if="!isSharedView" class="text-description">Include failures you haven't shared publicly yet</p>
          </div>
          <div v-if="!isSharedView" class="cancel-btn" @click="toggleUnpublish = !toggleUnpublish">{{
            !toggleUnpublish ? 'Add' : 'Hide'
          }}
          </div>
        </div>
        <ul v-if="isSharedView || toggleUnpublish" class="mt-6">
          <li
            v-for="post in filteredDrafts"
            :key="post.id"
            :class="{selected: selectedPosts.some(p => p.id === post.id)}"
          >
            <div v-if="!isSharedView" class="d-block">
              <v-checkbox
                v-model="selectedPosts"
                color="primary"
                hide-details
                :value="post"
              />
            </div>
            <div class="d-flex flex-column align-start" :class="{'ml-6': !isSharedView}">
              <div class="tag">{{ post.selectedCategories[0].label }}</div>
              <div class="title">{{ post.title }}</div>
              <div v-if="post?.lessonLearned?.cost || post?.lessonLearned?.recoveryTime" class="item-panel">
                <div v-if="post?.lessonLearned?.cost">💰Cost: {{ formatNumber(post.lessonLearned.cost) }}</div>
                <div v-if="post?.lessonLearned?.recoveryTime" class="ml-4">⏱️Recovery:
                  {{ post.lessonLearned.recoveryTime.title }}
                </div>
                <div v-if="post?.lessonLearned?.recoveryTime" class="ml-4">📚 {{ lessonCounter(post.lessonLearned) }}
                  lessons
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <Templates
        :display-user="displayUser"
        :initial-template="initialTemplate"
        :is-exporting="isExporting"
        :read-only="isSharedView"
        @template-update="templateSelected = $event"
      />
      <div class="wrapper mt-4">
        <div class="d-flex ga-4 ">
          <div
            class="submit-btn d-flex justify-center align-center"
            :class="[{disabled: selectedPosts.length === 0 || !templateSelected}, isSharedView ? 'w-100' : 'w-60']"
            @click="exportToPDF"
          >
            <div
              class="d-flex mr-3"
              v-html="getIcon('file')"
            />
            {{ templateSelected ? 'Download PDF': 'Generate Preview' }}
          </div>
          <div v-if="!isSharedView" class="cancel-btn d-flex align-center justify-center generate-btn" :class="isSharedView ? 'w-100' : 'w-40'" @click="generateSharableLink">
            <div class="d-flex mr-2" v-html="getIcon('share')" />
            Get Shareable Link
          </div>
        </div>
        <p v-if="!isSharedView && selectedPosts.length === 0" class="text-description text-center mt-2">Select at least one failure to generate your resume</p>
        <p v-else-if="!isSharedView" class="text-description text-center mt-2">Ready to generate resume with {{ selectedPosts.length }} failures</p>
      </div>
    </template>
  </div>
</template>
<style scoped lang="scss">
.disabled {
  background-color: #C0C0BD;
  pointer-events: none;
}
</style>
