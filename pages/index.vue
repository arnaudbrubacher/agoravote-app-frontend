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
import { ref, onMounted } from 'vue'
import axios from 'axios'

const data = ref([])
const error = ref(null)

const fetchData = async () => {
  try {
    const response = await axios.get('http://localhost:8080/groups')
    data.value = response.data
  } catch (err) {
    error.value = err
    console.error('Error fetching data:', err)
  }
}

onMounted(() => {
  fetchData()
})

definePageMeta({
  layout: 'landingpage'
})
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 50px;
}
</style>