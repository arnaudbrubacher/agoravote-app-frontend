<template>
  <div class="home-container">
    <h1>Welcome to Agora Vote</h1>
    <p>Your trusted platform for secure and transparent voting.</p>
    <button @click="startVoting" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Start Voting</button>
  </div>
</template>

<script>
export default {
  methods: {
    startVoting() {
      this.$router.push('/auth');
    }
  }
}
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 50px;
}
</style>