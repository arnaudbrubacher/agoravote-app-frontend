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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

definePageMeta({
  layout: 'app-layout'
})

const route = useRoute()
const router = useRouter()
const groupId = route.params.id

const group = ref({
  name: `Group ${groupId}`
})

const votes = ref([
  { id: 1, title: 'Budget Approval', status: 'Active' },
  { id: 2, title: 'Board Election', status: 'Completed' }
])

const posts = ref([
  { id: 1, author: 'John Doe', date: '2 hours ago', content: 'Meeting notes from yesterday...' },
  { id: 2, author: 'Jane Smith', date: '1 day ago', content: 'Updates on the project...' }
])

const members = ref([
  { id: 1, name: 'John Doe', role: 'Admin' },
  { id: 2, name: 'Jane Smith', role: 'Member' }
])

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