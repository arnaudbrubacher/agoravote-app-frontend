<template>
  <div class="space-y-6">
    <!-- Profile Info Card -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-start space-x-6">
          <div class="relative">
            <div v-if="profilePicture" class="w-24 h-24">
              <img 
                :src="profilePicture" 
                alt="Profile picture"
                class="w-full h-full rounded-full object-cover"
              />
            </div>
            <div v-else class="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <UserCircleIcon class="w-16 h-16 text-muted-foreground" />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              class="absolute -bottom-2 -right-2"
              @click="triggerFileInput"
            >
              <PencilIcon class="h-4 w-4" />
            </Button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept="image/*"
              @change="updateProfilePicture" 
            />
          </div>
          <div class="space-y-2 py-2">
            <h3 class="text-lg font-medium">{{ userName }}</h3>
            <p class="text-sm text-muted-foreground">{{ userEmail }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Posts Card -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Posts</CardTitle>
        </div>
        <Button @click="createPost">New Post</Button>
      </CardHeader>
      <CardContent>
        <div v-if="userPosts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="post in userPosts" 
            :key="post.id" 
            class="flex flex-col p-4 border rounded-lg h-[240px]"
          >
            <div class="space-y-3">
              <h3 class="text-lg font-medium">{{ post.title }}</h3>
              <div class="flex items-center space-x-2">
                <span class="font-medium">{{ userName }}</span>
                <span class="text-sm text-muted-foreground">{{ post.date }}</span>
              </div>
              <p class="text-sm text-muted-foreground line-clamp-4">{{ post.content }}</p>
            </div>
            <Button 
              variant="ghost" 
              @click="openPost(post)" 
              class="border mt-auto w-full"
            >
              View
            </Button>
          </div>
        </div>
        <div v-else class="text-center py-8 text-muted-foreground">
          No posts yet
        </div>
      </CardContent>
    </Card>

    <PostDetailsDialog 
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
      @edit="editPost"
      @delete="deletePost"
    />

    <NewPostDialog 
      v-if="showNewPostDialog"
      @close="showNewPostDialog = false"
      @submit="handleNewPost"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PostDetailsDialog from '@/components/PostDetailsDialog.vue'
import NewPostDialog from '@/components/NewPostDialog.vue'
import { UserCircleIcon, PencilIcon } from '@heroicons/vue/outline'

definePageMeta({
  layout: 'profile-layout'
})

// User data
const userName = ref('John Doe')
const userEmail = ref('john.doe@example.com')
const profilePicture = ref(null)
const fileInput = ref(null)

// Posts
const userPosts = ref([
  { 
    id: 1, 
    title: 'Project Update Meeting',
    content: 'Meeting notes from yesterday\'s discussion about the new features.',
    author: userName,
    date: '2 hours ago'
  },
  { 
    id: 2, 
    title: 'Technical Documentation',
    content: 'Updated documentation for the API endpoints.',
    author: userName,
    date: '1 day ago',
    file: true,
    fileName: 'api-docs.pdf',
    fileUrl: '#'
  },
  { 
    id: 3, 
    title: 'Team Building Event Photos',
    subject: 'Team Building Event',
    content: 'Photos from our team building event last weekend. Great memories!',
    author: userName,
    date: '3 days ago',
    file: true,
    fileName: 'team-photos.zip',
    fileUrl: '#'
  }
])

const newPostContent = ref('')

const newPost = ref({
  subject: '',
  content: '',
  file: null
})
const postFileInput = ref(null)

// Methods
const triggerFileInput = () => {
  fileInput.value.click()
}

const updateProfilePicture = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePicture.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const triggerPostFileInput = () => {
  postFileInput.value.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    newPost.value.file = file
  }
}

const showNewPostDialog = ref(false)

const createPost = () => {
  showNewPostDialog.value = true
}

const handleNewPost = (postData) => {
  const post = {
    id: Date.now(),
    subject: postData.title,
    content: postData.content,
    date: 'Just now'
  }

  if (postData.file) {
    post.file = postData.file
    post.fileName = postData.file.name
    post.fileUrl = URL.createObjectURL(postData.file)
  }

  userPosts.value.unshift(post)
  showNewPostDialog.value = false
}

const selectedPost = ref(null)

const openPost = (post) => {
  selectedPost.value = post
}

const editPost = (post) => {
  // Create a copy for editing
  newPost.value = { ...post }
  selectedPost.value = null
}

const deletePost = (postId) => {
  if (confirm('Are you sure you want to delete this post?')) {
    userPosts.value = userPosts.value.filter(p => p.id !== postId)
    selectedPost.value = null
  }
}
</script>