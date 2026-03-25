<route lang="json">
{
"meta": {
"layout": "MainLayout"
}
}
</route>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useFilterStore } from '@/stores/main/filter.js';
import { useLatestStore } from '@/stores/feed/latest';
import { usePopularStore } from '@/stores/feed/popular';
import Filter from '@/components/feed/Filter.vue';
import ForYouTab from '@/components/feed/tabs/ForYouTab.vue';
import LatestTab from '@/components/feed/tabs/LatestTab.vue';
import PopularTab from '@/components/feed/tabs/PopularTab.vue';
import MobileSlide from '@/components/MobileSlide.vue';
import '@/styles/pages/index.scss';

const { smAndUp } = useDisplay();
const authStore = useAuthStore();
const filterStore = useFilterStore();
const latestStore = useLatestStore();
const popularStore = usePopularStore();

const activeTab = ref('latest');
const isFilterPanel = ref(false);

// Define the tabs for the feed
const tabs = reactive([
  { label: 'Latest', value: 'latest', component: LatestTab },
  { label: 'Popular', value: 'popular', component: PopularTab },
]);

// Add "For You" tab if the user is authenticated
if (authStore.user) {
  tabs.push({ label: 'For You', value: 'for-you', component: ForYouTab });
}

/**
 * Computed property to count the number of active filters.
 */
const activeFilterCount = computed(() => {
  const filters = filterStore.selectedFilter;
  if (!filters) return 0;
  let count = 0;
  if (filters.categories?.length) count += filters.categories.length;
  if (filters.emojiTags?.length) count += filters.emojiTags.length;
  if (filters.recoveryTime?.length) count += filters.recoveryTime.length;
  if (filters.costRange?.length) count += filters.costRange.length;
  if (filters.postedBy) count += 1;
  return count;
});

/**
 * Computed property to check if the app is in development mode.
 */
const isDevMode = computed(() => location.hostname === 'localhost');

/**
 * Selects a tab and scrolls to the top of the page.
 * @param {object} tab - The selected tab.
 */
function selectTab(tab) {
  activeTab.value = tab.value;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Toggles the filter panel visibility.
 */
function toggleFilter() {
  isFilterPanel.value = !isFilterPanel.value;
}

/**
 * Applies the selected filters to the appropriate store.
 * @param {object} filters - The filters to apply.
 */
function applyFilters(filters) {
    if (activeTab.value === 'latest') {
        latestStore.applyPostFilters(filters);
    } else if (activeTab.value === 'popular') {
        popularStore.applyPostFilters(filters);
    }
    isFilterPanel.value = false;
}
</script>

<template>
  <div class="feed-page mt-4 mt-md-0">
    <section class="feed-main px-5">
      <!-- Tabs -->
      <div class="feed-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="feed-tab"
          :class="{ active: activeTab === tab.value }"
          @click="selectTab(tab)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Composer and Filter -->
      <div class="composer-card" :class="[{'mb-2 sm-mb-6': !isFilterPanel}, {'card-open': smAndUp && isFilterPanel}]">
        <div class="d-flex">
          <div class="font-weight-semibold cancel-btn" @click="$router.push('/create-post')">
            New failure
          </div>
        </div>
        <div class="composer-filter">
          <v-badge v-if="activeFilterCount > 0" color="primary" :content="activeFilterCount" floating>
            <v-icon icon="mdi-filter-variant" @click="toggleFilter" />
          </v-badge>
          <v-icon v-else icon="mdi-filter-variant" @click="toggleFilter" />
        </div>
      </div>

      <!-- Filter Panels -->
      <v-slide-y-transition>
        <Filter v-if="isFilterPanel && smAndUp" @apply="applyFilters" @close="isFilterPanel = false" />
      </v-slide-y-transition>
      <template v-if="!smAndUp">
        <MobileSlide v-model="isFilterPanel">
          <Filter title="Filter" @apply="applyFilters" @close="isFilterPanel = false" />
        </MobileSlide>
      </template>

      <!-- Dynamic Tab Component -->
      <component :is="tabs.find(t => t.value === activeTab).component" />
    </section>
  </div>
</template>
