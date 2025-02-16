<template>
  <div class="flex flex-col items-center justify-center space-y-6 text-center">
    <h1 class="text-4xl font-bold tracking-tighter">Welcome to Agora Vote</h1>
    <p class="text-lg text-muted-foreground">Your trusted platform for secure and transparent voting.</p>
  </div>
  <div>
    <h1>Data from API</h1>
    <ul>
      <li v-for="item in data" :key="item.id">{{ item.name }}</li>
    </ul>
    <div v-if="error">Error: {{ error.message }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useFetch } from '#app'

definePageMeta({
  layout: 'landingpage'
})

// Fetch data from the API endpoint
const { data, error } = await useFetch('http://localhost:8081/api/endpoint')

// Handle the error if any
if (error.value) {
  console.error('Error fetching data:', error.value)
}
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 50px;
}
</style>