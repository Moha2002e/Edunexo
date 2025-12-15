<script setup>
import Navbar from './components/Navbar.vue';
</script>

<template>
  <div class="app-wrapper">
    <Navbar />
    <router-view class="main-content"></router-view>
  </div>
</template>

<style>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content {
  flex: 1;
}
</style>
