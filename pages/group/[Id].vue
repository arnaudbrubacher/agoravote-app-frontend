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
            <ArrowLeftIcon class="h-4 w-4" />
            <span class="ml-2">Back</span>
          </Button>
          <div>
            <h1 class="text-3xl font-bold">{{ group.name }}</h1>
            <p class="text-muted-foreground">{{ group.description }}</p>
          </div>
        </div>
      </div>

      <!-- Group Info -->
      <Card class="w-full">
        <CardContent class="p-6">
          <div class="space-y-4">
            <div class="flex items-center space-x-2">
              <LockIcon v-if="group.isPrivate" class="h-4 w-4" />
              <UnlockIcon v-else class="h-4 w-4" />
              <span>{{ group.isPrivate ? 'Private Group' : 'Public Group' }}</span>
            </div>
            <div class="text-sm text-muted-foreground">
              Created {{ new Date(group.createdAt).toLocaleDateString() }}
            </div>
          </div>
        </CardContent>
      </Card>

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
import { ArrowLeftIcon, LockIcon, UnlockIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardHeader,
  CardTitle, 
  CardContent 
} from '@/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'

const route = useRoute()
const router = useRouter()
const group = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchGroup = async () => {
    try {
        // Add more detailed logging
        console.log('Route object:', route)
        console.log('Route params:', route.params)
        const groupId = route.params.id
        console.log('Extracted groupId:', groupId)

        if (!groupId) {
            error.value = 'No group ID provided'
            loading.value = false
            return
        }

        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/auth')
            return
        }

        // Log the full request URL and headers
        const requestUrl = `/groups/${groupId}`
        console.log('Making request to:', requestUrl)
        console.log('With token:', token.substring(0, 10) + '...')

        const response = await axios.get(requestUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        console.log('Response received:', response)

        if (!response.data) {
            throw new Error('No group data received')
        }

        group.value = response.data
        loading.value = false
        
    } catch (err) {
        console.error('Full error object:', err)
        error.value = err.response?.data?.error || err.message || 'Failed to load group'
        loading.value = false
    }
}

onMounted(() => {
    fetchGroup()
})
</script>