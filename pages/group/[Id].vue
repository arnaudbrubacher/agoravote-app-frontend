<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" @click="goToDashboard" class="p-2">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          <span class="ml-2">Back</span>
        </Button>
        <h1 class="text-3xl font-bold">{{ group.name }}</h1>
      </div>
      <Button variant="outline" @click="goToSettings">Settings</Button>
    </div>

    <Tabs defaultValue="votes" class="w-full">
      <TabsList>
        <TabsTrigger value="votes">Votes</TabsTrigger>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>

      <TabsContent value="votes">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Votes</CardTitle>
              <CardDescription>Current and past votes</CardDescription>
            </div>
            <Button @click="createVote">New Vote</Button>
          </CardHeader>
          <CardContent>
            <div v-if="votes.length" class="space-y-4">
              <div v-for="vote in votes" :key="vote.id" class="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 class="font-medium">{{ vote.title }}</h3>
                  <p class="text-sm text-muted-foreground">{{ vote.status }}</p>
                </div>
                <Button variant="ghost" @click="openVote(vote.id)">View</Button>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No votes yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="posts">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Posts</CardTitle>
              <CardDescription>Group discussions</CardDescription>
            </div>
            <Button @click="createPost">New Post</Button>
          </CardHeader>
          <CardContent>
            <div v-if="posts.length" class="space-y-4">
              <div v-for="post in posts" :key="post.id" class="p-4 border rounded-lg">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="font-medium">{{ post.author }}</span>
                  <span class="text-sm text-muted-foreground">{{ post.date }}</span>
                </div>
                <p>{{ post.content }}</p>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No posts yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="members">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>Group participants</CardDescription>
            </div>
            <Button @click="addMember">Add Member</Button>
          </CardHeader>
          <CardContent>
            <div v-if="members.length" class="space-y-2">
              <div v-for="member in members" :key="member.id" class="flex items-center justify-between p-2">
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ member.name }}</span>
                  <span class="text-sm text-muted-foreground">{{ member.role }}</span>
                </div>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            </div>
            <div v-else class="text-center py-8 text-muted-foreground">
              No members yet
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

definePageMeta({
  layout: 'app-layout'
})

const route = useRoute()
const router = useRouter()
const groupId = route.params.id

// Initialize with default values
const group = ref({
  id: groupId,
  name: '',
  description: '',
  picture: null,
  isPrivate: false,
  members: [],
  votes: [],
  posts: [],
  lastActive: ''
})

const votes = ref([])
const posts = ref([])
const members = ref([])

onMounted(async () => {
  try {
    if (router.currentRoute.value.state?.group) {
      group.value = router.currentRoute.value.state.group
      votes.value = group.value.votes || []
      posts.value = group.value.posts || []
      members.value = group.value.members || []
    } else {
      // Fallback sample data
      group.value = {
        id: groupId,
        name: 'Sample Group',
        description: 'This is a sample group description.',
        picture: null,
        isPrivate: false,
        members: [
          { id: 1, name: 'Alice', role: 'Admin' },
          { id: 2, name: 'Bob', role: 'Member' }
        ],
        votes: [
          { id: 1, title: 'Feature A', status: 'Open' },
          { id: 2, title: 'Feature B', status: 'Closed' }
        ],
        posts: [
          { id: 1, author: 'Alice', date: '2h ago', content: 'Discussion about Feature A' },
          { id: 2, author: 'Bob', date: '1h ago', content: 'Discussion about Feature B' }
        ],
        lastActive: '2h ago'
      }
      votes.value = group.value.votes
      posts.value = group.value.posts
      members.value = group.value.members
    }
  } catch (error) {
    console.error('Error loading group:', error)
  }
})

// Watch for changes in group data
watch(() => group.value, (newGroup) => {
  votes.value = newGroup.votes
  posts.value = newGroup.posts
  members.value = newGroup.members
}, { deep: true })

const createVote = () => {
  router.push(`/group/${groupId}/votes/new`)
}

const createPost = () => {
  router.push(`/group/${groupId}/posts/new`)
}

const addMember = () => {
  // Add member logic
}

const openVote = (voteId) => {
  router.push(`/group/${groupId}/votes/${voteId}`)
}

const goToSettings = () => {
  router.push(`/group/${groupId}/settings`)
}

const goToDashboard = () => {
  router.push('/dashboard')
}
</script>