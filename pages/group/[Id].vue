<template>
  <div class="group-container max-w-4xl mx-auto mt-10 p-6 border border-gray-300 rounded-lg bg-white">
    <h2 class="text-2xl font-bold mb-6">{{ group.name }}</h2>
    <div class="mb-10">
      <h3 class="text-xl font-semibold mb-4">Votes</h3>
      <button @click="createVote" class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-2">Create New Vote</button>
      <ul>
        <li v-for="vote in votes" :key="vote.id" class="mb-2">
          {{ vote.title }} ({{ vote.status }})
        </li>
      </ul>
    </div>
    <div class="mb-10">
      <h3 class="text-xl font-semibold mb-4">Posts</h3>
      <button @click="createPost" class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-2">Create New Post</button>
      <ul>
        <li v-for="post in posts" :key="post.id" class="mb-2">
          {{ post.title }} ({{ post.status }})
        </li>
      </ul>
    </div>
    <div class="mb-10">
      <h3 class="text-xl font-semibold mb-4">Members</h3>
      <button @click="addMember" class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-2">Add New Member</button>
      <ul>
        <li v-for="member in members" :key="member.id" class="mb-2">
          {{ member.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const groupId = route.params.id

const group = ref({
  id: groupId,
  name: `Group ${groupId}`
})

const votes = ref([
  { id: 1, title: 'Vote 1', status: 'Active' },
  { id: 2, title: 'Vote 2', status: 'History' }
])

const posts = ref([
  { id: 1, title: 'Post 1', status: 'Active' },
  { id: 2, title: 'Post 2', status: 'History' }
])

const members = ref([
  { id: 1, name: 'Member 1' },
  { id: 2, name: 'Member 2' }
])

const createVote = () => {
  alert('Create new vote')
}

const createPost = () => {
  alert('Create new post')
}

const addMember = () => {
  alert('Add new member')
}
</script>

<style scoped>
.group-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}
</style>