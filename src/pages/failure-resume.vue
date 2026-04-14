<route lang="json">
{
  "meta": {
    "layout": "MainLayout",
    "auth": true
  }
}
</route>
<script setup>
  import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
  import { useToast } from 'vue-toastification'
  import { recoveryTimeOptions } from '@/models/categories.js'
  import id from '@/pages/post/[id].vue'
  import { useAuthStore } from '@/stores/auth.js'
  import { useProfileStore } from '@/stores/profile/profile.js'
  import { floatNumber, formatNumber } from '../utils/format-number.js'
  import '@/styles/pages/failure-resume.scss'
  //
  const profileStore = useProfileStore()
  const auth = useAuthStore()
  const posts = ref([])
  const selectedPosts = ref([])
  const isExporting = ref(false)
  const postIsLoading = ref(false)
  const toast = useToast()

  //
  onBeforeMount(() => {
    removeScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
  })
  onMounted(() => {
    postIsLoading.value = true
    profileStore.fetchUserPosts(auth.user.uid)
      .then(res => {
        posts.value = res
      })
      .finally(() => {
        postIsLoading.value = false
      })
    addScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
  })

  const lessonsLearned = computed(() => {
    return posts.value.filter(el => el.lessonLearned).length
  })
  const totalCost = computed(() => {
    return posts.value.map(el => el.lessonLearned)
      .filter(Boolean)
      .map(el => el.cost)
      .reduce((a, b) => Number(a) + Number(b), 0)
  })
  const allSelected = computed(() => selectedPosts.value.length === posts.value.length && posts.value.length > 0)
  function selectAll () {
    selectedPosts.value = allSelected.value ? [] : posts.value.map(p => p.id)
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
    const body = document.querySelector('html')
    body.style.overflow = 'hidden'
    try {
      const res = selectedPosts.value
      if (!res || res.length === 0) {
        toast.error('Collection is empty')
        return
      }

      await nextTick()

      // Add a small delay to ensure all content (especially images) is rendered
      await new Promise(resolve => setTimeout(resolve, 1500))

      const exportWrapper = document.querySelector('#exporting-wrapper')

      const opt = {
        margin: 0.5,
        filename: `Failure Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
        },
      }
      html2pdf().from(exportWrapper).set(opt).save().then(() => {
        toast.success('PDF generated')
        isExporting.value = false
        body.style.overflow = 'visible'
      }).catch(error => {
        console.error('PDF Export Error:', error)
        toast.error('Failed to generate PDF')
      })
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast.error('Failed to generate PDF')
    }
  }

</script>
<template>
  <div class="failure-resume-page">
    <div v-if="isExporting" class="overlay">
      <h3 class="mb-5">Generating PDF</h3>
      <v-progress-linear color="primary" indeterminate />
    </div>
    <div v-if="isExporting" id="exporting-wrapper">
      <div v-for="post in selectedPosts" :key="post">
        <div class="post-card-export">
          <id :id="post" />
        </div>
        <div class="html2pdf__page-break" />
      </div>
    </div>
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
        <div class="d-flex justify-space-between mb-3">
          <h4>Select Failures to Include</h4>
          <p class="cursor-pointer text-primary fs-14" @click="selectAll">{{ allSelected ? 'Deselect All' : 'Select All' }}</p>
        </div>
        <ul>
          <li
            v-for="post in posts"
            :key="post.id"
            :class="{selected: selectedPosts.includes(post.id)}"
          >
            <div class="d-block">
              <v-checkbox
                v-model="selectedPosts"
                color="primary"
                hide-details
                :value="post.id"
              />
            </div>
            <div class="d-flex flex-column align-start ml-6">
              <div class="tag">{{ post.selectedCategories[0].label }}</div>
              <div class="title">{{ post.title }}</div>
              <div v-if="post?.lessonLearned?.cost || post?.lessonLearned?.recoveryTime" class="item-panel">
                <div v-if="post?.lessonLearned?.cost">💰Cost: {{ formatNumber(post.lessonLearned.cost) }}</div>
                <div v-if="post?.lessonLearned?.recoveryTime" class="ml-4">⏱️Recovery: {{ post.lessonLearned.recoveryTime.title }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div
        v-if="selectedPosts.length > 0"
        class="submit-btn mt-4"
        @click="exportToPDF"
      >Export PDF</div>
    </template>
  </div>
</template>
