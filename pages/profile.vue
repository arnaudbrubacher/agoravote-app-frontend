<template>
  <div class="profile-container max-w-md mx-auto mt-10 p-6 border border-gray-300 rounded-lg bg-white">
    <h2 class="text-2xl font-bold mb-6">Profile</h2>
    <p>Name: John Doe</p>
    <p>Email: john.doe@example.com</p>
    <!-- Add more profile details as needed -->
  </div>
</template>

<script>
export default {
  name: 'Profile'
}
</script>

<style scoped>
.profile-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}
</style>