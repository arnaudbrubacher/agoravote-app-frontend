<template>
  <div class="container mx-auto p-6">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      Loading group information...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <!-- Group Content -->
    <div v-else-if="group" class="space-y-6">
      <!-- Group Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Button variant="ghost" @click="router.push('/dashboard')" class="p-2 border">
            <Icon name="heroicons:arrow-left" class="h-4 w-4" />
            <span class="ml-2">Back</span>
          </Button>
          <div>
            <h1 class="text-3xl font-bold">{{ group.name }}</h1>
            <p class="text-muted-foreground">{{ group.description }}</p>
          </div>
        </div>
        <Button v-if="group.isAdmin" variant="outline" @click="showSettings = true">
          Settings
        </Button>
      </div>

      <!-- Group Content Tabs -->
      <Tabs defaultValue="votes" class="w-full">
        <TabsList>
          <TabsTrigger value="votes">Votes</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <!-- Votes Tab -->
        <TabsContent value="votes">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Votes</CardTitle>
              <Button v-if="group.isAdmin" @click="showNewVoteDialog = true">
                New Vote
              </Button>
            </CardHeader>
            <CardContent>
              <!-- Votes list -->
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Posts Tab -->
        <TabsContent value="posts">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Posts</CardTitle>
              <Button @click="showNewPostDialog = true">New Post</Button>
            </CardHeader>
            <CardContent>
              <!-- Posts list -->
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Members Tab -->
        <TabsContent value="members">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Members</CardTitle>
              <Button v-if="group.isAdmin" @click="showAddMemberDialog = true">
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div v-if="group.members?.length" class="space-y-4">
                <div v-for="member in group.members" :key="member.id"
                  class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium">{{ member.name }}</span>
                    <span class="text-sm text-muted-foreground">{{ member.role }}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '~/src/utils/axios'

const route = useRoute()
const router = useRouter()
const group = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchGroup = async () => {
    const groupId = route.params.id
    if (!groupId || groupId === 'undefined') {
        error.value = 'Invalid group ID'
        loading.value = false
        return
    }

    try {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/login')
            return
        }

        const response = await axios.get(`/groups/${groupId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        group.value = response.data
    } catch (err) {
        error.value = err.response?.data?.error || 'Failed to load group'
        console.error('Error fetching group:', err)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchGroup()
})
</script>