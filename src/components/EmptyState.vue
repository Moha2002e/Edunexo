<script setup>
defineProps({
    icon: Object,
    title: String,
    description: String
});
</script>

<template>
  <div class="empty-box">
    <component :is="icon" class="empty-icon" size="48" />
    <div class="empty-text">{{ title }}</div>
    <div class="empty-sub">{{ description }}</div>
    <slot name="action"></slot>
  </div>
</template>

<style scoped>
.empty-box {
  text-align: center;
  background: white;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 3rem 1rem;
  color: #95a5a6;
}
.empty-icon {
  color: #bdc3c7;
  margin-bottom: 1rem;
}
.empty-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}
.empty-sub {
  font-size: 0.95rem;
  max-width: 300px;
  margin: 0 auto;
  line-height: 1.5;
}
</style>
