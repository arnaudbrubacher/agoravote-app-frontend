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
          <div class="flex-1 space-y-2 py-2">
            <h3 class="text-lg font-medium">{{ userName }}</h3>
            <p class="text-sm text-muted-foreground">{{ userEmail }}</p>
          </div>
          <div class="flex items-center ml-auto space-x-2">
            <Button 
              variant="outline" 
              @click="logout"
            >
              Log Out
            </Button>
            <Button 
              variant="outline" 
              @click="deleteAccount"
              class="text-red-600"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Groups</CardTitle>
        </div>
        <Button 
          variant="default"
          @click="showNewGroupDialog = true"
        >
          Create New Group
        </Button>
      </CardHeader>
      <CardContent>
        <ul class="space-y-4">
          <li v-for="group in userGroups" :key="group.id">
            <Button 
              variant="ghost" 
              class="w-full justify-start text-left p-6 min-h-[100px] border rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all"
              @click="openGroup(group.id)"
            >
              <div class="flex items-center space-x-6">
                <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <div v-if="group.picture" :style="{ backgroundColor: group.picture }" class="w-full h-full rounded-lg"></div>
                  <Icon v-else name="heroicons:user-group" class="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold">{{ group.name }}</h3>
                  <p class="text-sm text-muted-foreground">ID: {{ group.id }} • {{ group.members.length }} members • Last active {{ group.lastActive }}</p>
                </div>
              </div>
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Find Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <Input 
          v-model="searchQuery" 
          placeholder="Find groups..." 
          class="w-full max-w-md mb-4"
        />
        <div v-if="searchQuery && filteredGroups.length" class="space-y-2">
          <div 
            v-for="group in filteredGroups" 
            :key="group.id" 
            class="p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-all"
            @click="openAdmissionForm(group)"
          >
            <h3 class="text-lg font-medium">{{ group.name }}</h3>
            <p class="text-sm text-muted-foreground">ID: {{ group.id }}</p>
          </div>
        </div>
        <div v-else-if="searchQuery" class="text-center py-8 text-muted-foreground">
          No groups found
        </div>
      </CardContent>
    </Card>

    <NewGroupDialog 
      v-if="showNewGroupDialog"
      @close="showNewGroupDialog = false"
      @group-created="addGroup"
    />

    <GroupAdmissionForm 
      v-if="showAdmissionForm"
      :group="selectedGroup"
      @close="showAdmissionForm = false"
      @submit="submitAdmissionForm"
    />

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import Icon from '@/components/Icon.vue'
import NewGroupDialog from '@/components/NewGroupDialog.vue'
import GroupAdmissionForm from '@/components/GroupAdmissionForm.vue'
import PostDetailsDialog from '@/components/PostDetailsDialog.vue'
import NewPostDialog from '@/components/NewPostDialog.vue'
import { UserCircleIcon, PencilIcon } from '@heroicons/vue/outline'
import axios from 'axios'

definePageMeta({
  layout: 'app-layout'
})

// Router
const router = useRouter()

const showNewGroupDialog = ref(false)
const showAdmissionForm = ref(false)
const searchQuery = ref('')
const selectedGroup = ref(null)

const groups = ref([])

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:8080/user/groups')
    console.log('Fetched user groups:', response.data) // Debugging statement
    groups.value = response.data
  } catch (error) {
    console.error('Error fetching user groups:', error)
  }
  
  // Fetch user data
  try {
    const userResponse = await axios.get('http://localhost:8080/user/profile')
    userName.value = userResponse.data.name
    userEmail.value = userResponse.data.email
    profilePicture.value = userResponse.data.profilePicture
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
})

const userId = 1 // Example user ID

const userGroups = computed(() => {
  return groups.value
})

const filteredGroups = computed(() => {
  if (!searchQuery.value) {
    return []
  }
  return groups.value.filter(group => 
    group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const groupData = ref({
  name: '',
  description: '',
  picture: null,
  isPrivate: false,
  requiresPassword: false,
  password: ''
})

const createGroup = async () => {
  try {
    const response = await axios.post('http://localhost:8080/groups', groupData.value)
    groups.value.unshift(response.data)
    showNewGroupDialog.value = false
  } catch (error) {
    console.error('Error creating group:', error)
  }
}

const addGroup = (newGroup) => {
  groups.value.unshift(newGroup)
}

const openGroup = (groupId) => {
  const selectedGroup = groups.value.find(g => g.id === groupId)
  if (selectedGroup) {
    router.push({
      path: `/group/${groupId}`,
      state: { group: selectedGroup }
    })
  }
}

const openAdmissionForm = (group) => {
  selectedGroup.value = group
  showAdmissionForm.value = true
}

const submitAdmissionForm = (admissionData) => {
  // Handle the admission form submission
  console.log('Admission data submitted:', admissionData)
  showAdmissionForm.value = false
}

// Profile data and methods
const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const fileInput = ref(null)

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

const logout = () => {
  // Clear user session or token
  localStorage.removeItem('token')
  router.push('/auth')
}

const deleteAccount = async () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    try {
      await axios.delete(`http://localhost:8080/user/${userId}`)
      // Clear user session or token
      localStorage.removeItem('token')
      router.push('/auth')
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }
}

// Posts data and methods
const userPosts = ref([])

const newPostContent = ref('')

const newPost = ref({
  subject: '',
  content: '',
  file: null
})
const postFileInput = ref(null)

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

const goBack = () => {
  router.push('/dashboard')
}
</script>

<style>
/* Your styles here */
</style>