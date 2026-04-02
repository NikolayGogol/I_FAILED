<script setup>
  import { computed, reactive, ref, watch } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import { useFailureAgeStore } from '@/stores/failure-age.js'
  const failureAgeStore = useFailureAgeStore()
  //
  const list = reactive([
    {
      title: 'First Failure',
      description: 'Share 1 failure',
      text: 'Shared your first failure',
      icon: getIcon('leaf'),
      isDone: false,
    },
    {
      title: 'Open Book',
      description: 'Share 5 failures',
      text: 'Shared 4 failures publicly',
      icon: getIcon('open-book'),
    },
    {
      title: 'Lesson Master',
      description: 'Learn 20 lessons',
      text: 'Learned 11 lessons',
      icon: getIcon('graduate'),
    },
    {
      title: 'Community Helper',
      description: 'Make 50 helpful comments',
      text: 'Made 42 helpful comments',
      icon: getIcon('hand-connect'),
    },
    {
      title: 'Quick Recoverer',
      description: 'Fast recovery',
      text: 'Recovered from failure in under 1 month',
      icon: getIcon('flashlight'),
    },
    {
      title: 'Resilient',
      description: 'Resolve all failures',
      text: '1 unresolved failures',
      icon: getIcon('arm'),
    },
  ])
  const shareFailure = computed(() => failureAgeStore.majorFailuresShared)
  const shareFailurePublic = computed(() => failureAgeStore.shareFailurePublic)
  const lessonsLearnedCount = computed(() => failureAgeStore.lessonsLearnedCount)
  //
  watch(() => shareFailure.value, val => {
    list[0].isDone = !!val
  }, { immediate: true })
  watch(() => ({
    a: shareFailure.value,
    b: shareFailurePublic.value,
  }), val => {
    list[1].isDone = val.a >= 5 && val.b >= 4
  }, { immediate: true })
  watch(() => ({
    a: shareFailure.value,
    b: lessonsLearnedCount.value,
  }), value => {
    list[5].isDone = (value.a - value.b) === 1
  }, { immediate: true })
</script>

<template>
  <section class="section achievement-badges">
    <div class="title-section">Achievement Badges</div>
    <v-row class="mt-4">
      <v-col
        v-for="(item, index) in list"
        :key="index"
        class="item pa-2"
        :class="{'done': item.isDone}"
        cols="12"
        sm="6"
      >
        <div
          v-if="item.isDone"
          class="done-icon"
          v-html="getIcon('green-check')"
        />
        <div class="d-flex border-c">
          <div class="icon d-flex mr-2" v-html="item.icon" />
          <div class="d-flex flex-column">
            <div class="title">{{ item.title }}</div>
            <div class="description">{{ item.description }}</div>
            <div class="rule">{{ item.text }}</div>
          </div>
        </div>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped lang="scss">

</style>
