<template>
  <div class="space-y-6">
    <!-- Profile Info Card -->
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
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
              <Icon name="heroicons:user-circle" class="w-16 h-16 text-muted-foreground" />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              class="absolute -bottom-2 -right-2"
              @click="triggerFileInput"
            >
              <Icon name="heroicons:pencil" class="h-4 w-4" />
            </Button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept="image/*"
              @change="updateProfilePicture" 
            />
          </div>
          <div class="space-y-2">
            <h3 class="text-lg font-medium">{{ userName }}</h3>
            <p class="text-sm text-muted-foreground">{{ userEmail }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Posts Section -->
    <Card>
      <CardHeader>
        <CardTitle>Your Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- New Post Form -->
          <form @submit.prevent="createPost" class="space-y-4 mb-6 border rounded-lg p-4">
            <div class="space-y-2">
              <Label for="subject">Subject</Label>
              <Input 
                id="subject"
                v-model="newPost.subject"
                placeholder="Post subject"
                type="text"
              />
            </div>

            <div class="space-y-2">
              <Label for="content">Content</Label>
              <Input 
                id="content"
                v-model="newPost.content"
                type="text"
                placeholder="Write your post..."
              />
            </div>

            <div class="space-y-2">
              <Label for="file">Attachment</Label>
              <div class="flex items-center space-x-2">
                <Button 
                  type="button"
                  variant="outline"
                  @click="triggerPostFileInput"
                >
                  Upload File
                </Button>
                <span v-if="newPost.file" class="text-sm">
                  {{ newPost.file.name }}
                </span>
              </div>
              <input 
                id="postFile"
                type="file"
                ref="postFileInput"
                class="hidden"
                @change="handleFileUpload"
              />
            </div>

            <Button type="submit" class="w-full">Create Post</Button>
          </form>

          <!-- Posts List -->
          <div v-if="userPosts.length" class="space-y-4">
            <div 
              v-for="post in userPosts" 
              :key="post.id" 
              class="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              @click="selectedPost = post"
            >
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-medium">{{ post.subject }}</h3>
                  <span class="text-sm text-muted-foreground">{{ post.date }}</span>
                </div>
                <p class="line-clamp-2">{{ post.content }}</p>
                <div v-if="post.file" class="flex items-center space-x-2">
                  <Icon name="heroicons:document" class="h-5 w-5" />
                  <span class="text-primary">{{ post.fileName }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-muted-foreground">
            No posts yet
          </div>
        </div>
      </CardContent>
    </Card>

    <PostViewer 
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
      @edit="editPost"
      @delete="deletePost"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    subject: 'Project Update Meeting',
    content: 'Meeting notes from yesterday\'s discussion about the new features. Key points: improved user interface, better performance, and new voting system.',
    date: '2 hours ago'
  },
  { 
    id: 2, 
    subject: 'Technical Documentation',
    content: 'Updated documentation for the API endpoints. Please review and provide feedback.',
    date: '1 day ago',
    file: true,
    fileName: 'api-docs.pdf',
    fileUrl: '#'
  },
  { 
    id: 3, 
    subject: 'Team Building Event',
    content: 'Photos from our team building event last weekend. Great memories!',
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

const createPost = () => {
  if (!newPost.value.subject.trim() || !newPost.value.content.trim()) return

  const post = {
    id: newPost.value.id || Date.now(),
    subject: newPost.value.subject,
    content: newPost.value.content,
    date: newPost.value.id ? newPost.value.date : 'Just now'
  }

  if (newPost.value.file) {
    post.file = newPost.value.file
    post.fileName = newPost.value.file.name
    post.fileUrl = URL.createObjectURL(newPost.value.file)
  }

  if (newPost.value.id) {
    // Update existing post
    const index = userPosts.value.findIndex(p => p.id === newPost.value.id)
    if (index !== -1) {
      userPosts.value[index] = post
    }
  } else {
    // Create new post
    userPosts.value.unshift(post)
  }

  // Reset form
  newPost.value = {
    subject: '',
    content: '',
    file: null
  }
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