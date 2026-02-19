<script setup>
  import '@/styles/components/feed/post-card.scss'

  defineProps({
    post: {
      type: Object,
      required: true,
    },
  })
</script>

<template>
  <div class="post-card">
    <header class="post-header">
      <div class="post-avatar">
        <span>{{ post.authorInitials }}</span>
      </div>
      <div class="post-author">
        <div class="post-author-name">{{ post.author }}</div>
        <div class="post-author-handle">@{{ post.handle }}</div>
      </div>
      <v-spacer />
      <v-btn icon size="small" variant="text">
        <v-icon>mdi-dots-horizontal</v-icon>
      </v-btn>
    </header>

    <div class="post-tags">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="post-tag"
      >
        {{ tag }}
      </span>
    </div>

    <h2 class="post-title">
      {{ post.title }}
    </h2>

    <p class="post-body">
      {{ post.excerpt }}
      <button class="read-more">Read more</button>
    </p>

    <div class="post-chips">
      <span
        v-for="chip in post.chips"
        :key="chip"
        class="post-chip"
      >
        {{ chip }}
      </span>
    </div>

    <div class="post-meta">
      <div class="meta-item">
        <span class="meta-label">Cost:</span>
        <span>{{ post.cost }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Recovery:</span>
        <span>{{ post.recovery }}</span>
      </div>
    </div>

    <footer class="post-footer">
      <button class="icon-btn">
        <v-icon size="18">mdi-heart-outline</v-icon>
        <span>{{ post.likes }}</span>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-comment-outline</v-icon>
        <span>{{ post.comments }}</span>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-eye-outline</v-icon>
        <span>{{ post.views }}</span>
      </button>
      <v-spacer />
      <button class="icon-btn">
        <v-icon size="18">mdi-bookmark-outline</v-icon>
      </button>
      <button class="icon-btn">
        <v-icon size="18">mdi-share-variant</v-icon>
      </button>
    </footer>
  </div>
</template>
