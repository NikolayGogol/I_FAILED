<route lang="json">
{
"meta": {
"layout": "MainLayout"
}
}
</route>
<script setup>
  import { ref } from 'vue'
  import { getIcon } from '@/models/icons.js'
  import '../styles/pages/premium.scss'
  //
  const tabs = [
    {
      label: 'Monthly',
      value: 'monthly',
      price: 9.99,
      period: '/ month',
    },
    {
      label: 'Yearly',
      value: 'yearly',
      discount: -17,
      period: '/ month',
      price: 8.33,
      billed: 'Billed 99.9 annually',
    },
  ]
  const selectedTab = ref(tabs[0])
  const everything = [
    {
      text: 'Unlimited anonymous posts',
    },
    {
      text: 'Advanced analytics on your failures',
    },
    {
      text: 'Custom "Failure Resume" templates',
    },
    {
      text: 'Ad-free experience',
    },
    {
      text: 'Priority support',
    },
    {
      text: '"Verified Resilience" badge',
    },
    {
      text: 'Export all your data',
    },
    {
      text: 'Custom themes',
    },
    {
      text: 'Early access to new features',
    },
  ]
  const tableData = [
    {
      name: 'Unlimited anonymous posts',
      free: 'Limited',
      premium: getIcon('green-check'),
    },
    {
      name: 'Advanced analytics on your failures',
      free: 'Limited',
      premium: getIcon('green-check'),
    },
    {
      name: 'Custom "Failure Resume" templates',
      free: getIcon('red-cross'),
      premium: getIcon('green-check'),
    },
    {
      name: 'Ad-free experience',
      free: getIcon('red-cross'),
      premium: getIcon('green-check'),
    },
    {
      name: 'Priority support',
      free: getIcon('red-cross'),
      premium: getIcon('green-check'),
    },
    {
      name: '"Verified Resilience" badge',
      free: getIcon('red-cross'),
      premium: getIcon('green-check'),
    },
    {
      name: 'Export all your data',
      free: 'Limited',
      premium: getIcon('green-check'),
    },
    {
      name: 'Custom themes',
      free: 'Limited',
      premium: getIcon('green-check'),
    },
    {
      name: 'Early access to new features',
      free: getIcon('red-cross'),
      premium: getIcon('green-check'),
    },
  ]
</script>
<template>
  <div class="premium-page">
    <div class="premium-wrapper">
      <div class="label text-white text-center font-weight-semibold">✨ PREMIUM</div>
      <h1 class="text-center text-white font-weight-bold">Level Up Your <br>Failure Journey</h1>
      <div class="sub-title text-white text-center">
        Get exclusive features to track, analyze, and share your growth through failures
      </div>
      <ul class="tabs">
        <li
          v-for="tab in tabs"
          :key="tab.value"
          :class="{active: selectedTab.value === tab.value}"
          @click="selectedTab = tab"
        >
          {{ tab.label }}
          <div v-if="tab?.discount" class="discount">
            {{ tab.discount }}%
          </div>
        </li>
      </ul>
      <div class="content">
        <div class="price font-weight-bold">${{ selectedTab.price }}</div>
        <div class="period">{{ selectedTab.period }}</div>
      </div>
      <div v-show="selectedTab?.billed" class="billed">{{ selectedTab.billed }}</div>
      <button class="button" type="button">Upgrade to Premium</button>
      <p class="returned">30-day money-back guarantee • Cancel anytime</p>
    </div>
    <section class="everything-wrapper section">
      <h4 class="text-center">Everything You Need to Grow</h4>
      <ul>
        <li v-for="(item, index) in everything" :key="index">
          <div class="icon-wrapper">
            <v-icon icon="mdi-check" />
          </div>
          {{ item.text }}
        </li>
      </ul>
    </section>
    <section class="mt-10 px-4">
      <v-row class="ga-4">
        <v-col class="section px-2 item-card">
          <div class="icon">
            <img alt="" src="../assets/premium/2.png">
          </div>
          <div class="title">Advanced Analytics</div>
          <p class="text-description">Deep insights into your failure patterns and recovery times</p>
        </v-col>
        <v-col class="section px-2 item-card">
          <div class="icon">
            <img alt="" src="../assets/premium/3.png">
          </div>
          <div class="title">Anonymous Posts</div>
          <p class="text-description">Share your biggest failures without revealing your identity</p>
        </v-col>
        <v-col class="section px-2 item-card">
          <div class="icon">
            <img alt="" src="../assets/premium/1.png">
          </div>
          <div class="title">Verified Badge</div>
          <p class="text-description">Stand out with the "Verified Resilience" badge on your profile</p>
        </v-col>
      </v-row>
    </section>
    <v-expansion-panels class="px-1 mt-10">
      <v-expansion-panel>
        <v-expansion-panel-title>Compare Plans</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-left font-weight-semibold" style="font-size: 16px">
                  Feature
                </th>
                <th class="text-center header-title">
                  Free
                </th>
                <th class="text-center font-weight-semibold text-primary">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(data, index) in tableData"
                :key="index"
              >
                <td class="py-4 text-darken-4">{{ data.name }}</td>
                <td>
                  <div class="d-flex justify-center header-title font-weight-regular" v-html="data.free" />
                </td>
                <td>
                  <div class="d-flex justify-center" v-html="data.premium" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <section class="section comment-feedback">
      <h4 class="text-center">Loved by Premium Members</h4>
      <ul>
        <li>
          <div class="d-flex align-center">
            <v-img src="../assets/premium/avatar%20medium.png" />
            <div class="name">Michael Chen</div>
            <div class="tag">
              <v-icon icon="mdi-check" />
              Verified
            </div>
          </div>
          <div class="comment">"The analytics helped me understand patterns in my failures. Worth every penny!"</div>
        </li>
        <li>
          <div class="d-flex align-center">
            <v-img src="../assets/premium/das.png" />
            <div class="name">Sarah Johnson</div>
            <div class="tag">
              <v-icon icon="mdi-check" />
              Verified
            </div>
          </div>
          <div class="comment">Anonymous posting let me share my biggest mistakes without fear. Game changer."</div>
        </li>
        <li>
          <div class="d-flex align-center">
            <v-img src="../assets/premium/gfs.png" />
            <div class="name">David Park</div>
            <div class="tag">
              <v-icon icon="mdi-check" />
              Verified
            </div>
          </div>
          <div class="comment">"The custom resume templates made sharing my journey with investors so much easier."</div>
        </li>
      </ul>
    </section>
    <section class="section faq">
      <h4 class="text-center mb-5">Frequently Asked Questions</h4>
      <div class="title">Can I cancel anytime?</div>
      <p class="text-description">Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
      <v-divider class="my-4" />
      <div class="title">What's the refund policy?</div>
      <p class="text-description">We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund within 30 days.</p>
      <v-divider class="my-4" />
      <div class="title">Can I switch between monthly and yearly?</div>
      <p class="text-description">Absolutely! You can upgrade to yearly at any time and we'll prorate the difference.</p>
      <v-divider class="my-4" />
      <div class="title">What happens to my anonymous posts if I downgrade?</div>
      <p class="text-description">Your anonymous posts will remain anonymous, but you won't be able to create new ones without Premium.</p>
    </section>
    <div class="trial">
      <h1>Try Premium free for 14 days</h1>
      <p>Unlock all premium features and explore the full experience. Cancel anytime during the trial.</p>
      <button class="button" type="button">Start 14 days FREE trial</button>
    </div>
  </div>
</template>
