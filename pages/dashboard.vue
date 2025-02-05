<template>
  <div class="dashboard-container max-w-4xl mx-auto mt-10 p-6 border border-gray-300 rounded-lg bg-white">
    <div class="mb-6">
      <h3 class="text-xl font-semibold mb-4">Groups Joined</h3>
      <ul>
        <li v-for="group in groups" :key="group.id" class="mb-2">
          <a @click="openGroup(group.id)" class="cursor-pointer text-blue-600 hover:underline">{{ group.name }}</a>
        </li>
      </ul>
    </div>
    <div class="mb-10">
      <button @click="createGroup" class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Create New Group</button>
    </div>
    <div class="mb-10">
      <input type="text" v-model="searchQuery" placeholder="Search for existing groups" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      <button @click="searchGroups" class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2">Search</button>
    </div>
    <div class="mb-10">
      <button @click="goToProfile" class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Go to Profile</button>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()

const groups = ref([
  { id: 1, name: 'Group 1' },
  { id: 2, name: 'Group 2' }
])

const searchQuery = ref('')

const openGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}
</script>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}
</style>