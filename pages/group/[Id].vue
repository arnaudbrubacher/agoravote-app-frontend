<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" @click="goToDashboard" class="p-2 border">
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          <span class="ml-2">Back</span>
        </Button>
        <div>
          <h1 class="text-3xl font-bold">{{ group.name }}</h1>
          <div class="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
            <span>ID: {{ group.id }}</span>
            <div class="flex items-center">
              <Icon name="heroicons:users" class="h-4 w-4 mr-1" />
              <span>{{ group.members.length }} members</span>
            </div>
          </div>
        </div>
      </div>
      <Button variant="outline" @click="goToSettings">Settings</Button>
    </div>

    <Tabs defaultValue="votes" class="w-full">
      <TabsList class="flex justify-between">
        <div class="flex space-x-1">
          <TabsTrigger value="votes" class="border-2 border-transparent data-[state=inactive]:border-white/20 data-[state=inactive]:text-white/70 data-[state=active]:text-white">
            Votes
          </TabsTrigger>
          <TabsTrigger value="posts" class="border-2 border-transparent data-[state=inactive]:border-white/20 data-[state=inactive]:text-white/70 data-[state=active]:text-white">
            Posts
          </TabsTrigger>
        </div>
        <TabsTrigger value="members" class="border-2 border-transparent data-[state=inactive]:border-white/20 data-[state=inactive]:text-white/70 data-[state=active]:text-white">
          Members
        </TabsTrigger>
      </TabsList>

      <TabsContent value="votes">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Votes</CardTitle>
            </div>
            <Button @click="createVote">New Vote</Button>
          </CardHeader>
          <CardContent>
            <div v-if="sortedVotes.length" class="space-y-4">
              <div 
                v-for="vote in sortedVotes" 
                :key="vote.id" 
                class="flex items-center justify-between p-4 rounded-lg border"
                :class="{
                  'border-primary bg-primary/5': vote.status === 'Open',
                  'border-muted bg-muted/5 opacity-75': vote.status === 'Closed'
                }"
              >
                <div>
                  <div class="flex items-center space-x-2">
                    <span 
                      class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-primary': vote.status === 'Open',
                        'bg-muted': vote.status === 'Closed'
                      }"
                    ></span>
                    <h3 class="font-medium">{{ vote.title }}</h3>
                    <Icon 
                      v-if="vote.hasVoted" 
                      name="heroicons:check-circle" 
                      class="h-4 w-4 text-green-500" 
                    />
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    {{ vote.status }}
                    {{ vote.hasVoted ? '• Voted' : '' }}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  @click="openVote(vote.id)" 
                  class="border"
                >
                  View
                </Button>
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
            </div>
            <Button @click="createPost">New Post</Button>
          </CardHeader>
          <CardContent>
            <div v-if="posts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                v-for="post in posts" 
                :key="post.id" 
                class="flex flex-col p-4 border rounded-lg h-[240px]"
              >
                <div class="space-y-3">
                  <h3 class="text-lg font-medium">{{ post.title }}</h3>
                  <div class="flex items-center space-x-2">
                    <span class="font-medium">{{ post.author }}</span>
                    <span class="text-sm text-muted-foreground">{{ post.date }}</span>
                  </div>
                  <p class="text-sm text-muted-foreground line-clamp-4">{{ post.content }}</p>
                </div>
                <Button 
                  variant="ghost" 
                  @click="openPost(post.id)" 
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
      </TabsContent>

      <TabsContent value="members">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
            </div>
            <div class="flex items-center space-x-2">
              <Button v-if="isEditingMembers" variant="outline" @click="addMember">
                <Icon name="heroicons:plus" class="h-4 w-4 mr-2" />
                Add Member
              </Button>
              <Button @click="editMembers">
                {{ isEditingMembers ? 'Done' : 'Edit List' }}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="group.members.length" class="space-y-4">
              <div 
                v-for="member in group.members" 
                :key="member.id" 
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ member.name }}</span>
                  <span class="text-sm text-muted-foreground">{{ member.role }}</span>
                </div>
                <div v-if="!isEditingMembers">
                  <Button variant="ghost" size="sm" class="border" @click="viewMember(member)">
                    View
                  </Button>
                </div>
                <div v-else class="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="border"
                    @click="toggleRole(member)"
                  >
                    <Icon 
                      :name="member.role === 'Admin' ? 'heroicons:user-minus' : 'heroicons:user-plus'" 
                      class="h-4 w-4 mr-2" 
                    />
                    {{ member.role === 'Admin' ? 'Remove Admin' : 'Make Admin' }}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="border-red-200 hover:bg-red-100"
                    @click="removeMember(member.id)"
                  >
                    <Icon name="heroicons:trash" class="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
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
  <NewVoteDialog 
    v-if="showNewVoteDialog"
    @close="showNewVoteDialog = false"
    @submit="handleNewVote"
  />
  <VoteDetailsDialog 
    v-if="selectedVote"
    :vote="selectedVote"
    @close="selectedVote = null"
    @submit="handleVoteSubmit"
  />
  <PostDetailsDialog 
    v-if="selectedPost"
    :post="selectedPost"
    @close="selectedPost = null"
  />
  <NewPostDialog 
    v-if="showNewPostDialog"
    @close="showNewPostDialog = false"
    @submit="handleNewPost"
  />
  <GroupSettingsDialog
    v-if="showSettings"
    :group="group"
    @close="showSettings = false"
    @submit="handleSettingsSubmit"
  />
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import NewVoteDialog from '@/components/NewVoteDialog.vue'
import VoteDetailsDialog from '@/components/VoteDetailsDialog.vue'
import PostDetailsDialog from '@/components/PostDetailsDialog.vue'
import NewPostDialog from '@/components/NewPostDialog.vue'
import GroupSettingsDialog from '@/components/GroupSettingsDialog.vue'

definePageMeta({
  layout: 'app-layout'
})

const route = useRoute()
const router = useRouter()
const groupId = route.params.id

// Initialize with example groups data
const group = ref({
  id: 'group-1234567890',
  name: 'Software Development Team',
  description: 'Main group for development team coordination and decisions',
  picture: null,
  isPrivate: false,
  members: [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'Member' },
    { id: 3, name: 'Charlie', role: 'Member' }
  ],
  votes: [],
  posts: [],
  lastActive: new Date().toISOString()
})

// Store groups locally
const groups = ref([
  {
    id: 'group-1234567890',
    name: 'Marketing Strategy Team',
    description: 'Coordinate marketing campaigns and brand strategy',
    picture: null,
    isPrivate: false,
    members: [
      { id: 1, name: 'Alice', role: 'Admin' },
      { id: 2, name: 'Bob', role: 'Member' }
    ],
    votes: [],
    posts: [],
    lastActive: new Date().toISOString()
  },
  {
    id: 'group-9876543210',
    name: 'Product Development',
    description: 'Design and implementation of new features',
    picture: null,
    isPrivate: false,
    members: [
      { id: 1, name: 'Charlie', role: 'Admin' },
      { id: 2, name: 'Diana', role: 'Member' }
    ],
    votes: [],
    posts: [],
    lastActive: new Date().toISOString()
  },
  {
    id: 'group-5555555555',
    name: 'Office Management',
    description: 'Workplace organization and logistics',
    picture: null,
    isPrivate: true,
    members: [
      { id: 1, name: 'Eve', role: 'Admin' },
      { id: 2, name: 'Frank', role: 'Member' }
    ],
    votes: [],
    posts: [],
    lastActive: new Date().toISOString()
  }
])

const votes = ref([])
const posts = ref([])
const members = ref([])

// Add reactive ref for dialog visibility
const showNewVoteDialog = ref(false)
const selectedVote = ref(null)
const selectedPost = ref(null)
const showNewPostDialog = ref(false)
const showSettings = ref(false)

// Add edit mode state
const isEditingMembers = ref(false)

const editMembers = () => {
  isEditingMembers.value = !isEditingMembers.value
}

const removeMember = (memberId) => {
  group.value.members = group.value.members.filter(m => m.id !== memberId)
}

const toggleRole = (member) => {
  member.role = member.role === 'Admin' ? 'Member' : 'Admin'
}

const addMember = () => {
  // Show dialog or form to add new member
  // For now, add dummy member
  group.value.members.push({
    id: Date.now(),
    name: 'New Member',
    role: 'Member'
  })
}

onMounted(async () => {
  try {
    const currentGroup = groups.value.find(g => g.id === groupId)
    if (currentGroup) {
      group.value = currentGroup
    }
    if (router.currentRoute.value.state?.group) {
      group.value = router.currentRoute.value.state.group
    } else {
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
          { 
            id: 1,
            title: 'Office Coffee Machine',
            question: 'Which coffee machine should we get for the office?',
            choices: [
              { text: 'Professional Barista Machine', votes: 12 },
              { text: 'Automated Bean-to-Cup', votes: 8 },
              { text: 'Simple Filter Coffee Maker', votes: 5 }
            ],
            allowWriteIn: false,
            minChoices: 1,
            maxChoices: 1,
            startTime: '2024-03-01T09:00',
            endTime: '2024-03-15T17:00',
            status: 'Open',
            totalVotes: 25,
            hasVoted: true,
            userChoices: ['Professional Barista Machine']
          },
          {
            id: 2, 
            title: 'Next Team Building Event',
            question: 'What activity should we do for our next team building?',
            choices: [
              { text: 'Escape Room Experience', votes: 8 },
              { text: 'Cooking Class Together', votes: 12 },
              { text: 'Outdoor Adventure Day', votes: 15 },
              { text: 'Board Game Tournament', votes: 5 }
            ],
            writeInResponses: [
              { text: 'Paintball', count: 3 },
              { text: 'Wine Tasting', count: 2 }
            ],
            allowWriteIn: true,
            minChoices: 1,
            maxChoices: 2,
            startTime: '2024-02-20T09:00',
            endTime: '2024-02-27T17:00',
            status: 'Closed',
            totalVotes: 45,
            hasVoted: true
          },
          { 
            id: 3, 
            title: 'Office Layout Changes',
            question: 'Which changes should we implement in our office space?',
            choices: [
              { text: 'More Meeting Rooms', votes: 0 },
              { text: 'Larger Break Area', votes: 0 },
              { text: 'Standing Desks', votes: 0 }
            ],
            allowWriteIn: false,
            minChoices: 1,
            maxChoices: 1,
            startTime: '2024-03-15T09:00',
            endTime: '2024-03-22T17:00',
            status: 'Open',
            totalVotes: 0,
            hasVoted: false
          },
          {
            id: 4,
            title: 'Company Holiday Party Theme',
            question: 'What should be the theme for this year\'s holiday party?',
            choices: [
              { text: 'Winter Wonderland', votes: 22 },
              { text: 'Masquerade Ball', votes: 18 },
              { text: 'Tropical Paradise', votes: 15 }
            ],
            allowWriteIn: true,
            writeInResponses: [
              { text: 'Hollywood Glamour', count: 5 }
            ],
            minChoices: 1,
            maxChoices: 1,
            startTime: '2024-02-01T09:00',
            endTime: '2024-02-15T17:00',
            status: 'Closed',
            totalVotes: 60
          },
          {
            id: 5,
            title: 'New Coffee Machine',
            question: 'Which coffee machine should we get for the office?',
            choices: [
              { text: 'Professional Barista Machine', votes: 0 },
              { text: 'Automated Bean-to-Cup', votes: 0 },
              { text: 'Simple Filter Coffee Maker', votes: 0 }
            ],
            allowWriteIn: false,
            minChoices: 1,
            maxChoices: 1,
            startTime: '2024-03-20T09:00',
            endTime: '2024-03-27T17:00',
            status: 'Open',
            totalVotes: 0
          }
        ],
        posts: [
          { 
            id: 1, 
            title: 'Discussion about Feature A',
            content: 'Detailed discussion about implementing Feature A...',
            author: 'Alice', 
            date: '2h ago' 
          },
          { 
            id: 2, 
            title: 'Discussion about Feature B',
            content: 'Detailed discussion about implementing Feature B...',
            author: 'Bob', 
            date: '1h ago' 
          }
        ],
        lastActive: '2h ago'
      }
    }
    votes.value = group.value.votes || []
    posts.value = group.value.posts || []
    members.value = group.value.members || []
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

// Update createVote function
const createVote = () => {
  showNewVoteDialog.value = true // Show dialog instead of navigating
}

// Add handler for new vote submission
const handleNewVote = (voteData) => {
  const newVote = {
    id: Date.now(),
    ...voteData,
    status: 'Pending'
  }
  votes.value.push(newVote)
  group.value.votes = votes.value // Update group votes
  showNewVoteDialog.value = false
}

const handleVoteSubmit = (voteData) => {
  const vote = votes.value.find(v => v.id === selectedVote.value.id)
  if (!vote) return

  // Update vote counts
  voteData.choices.forEach(choiceText => {
    const choice = vote.choices.find(c => c.text === choiceText)
    if (choice) choice.votes++
  })

  // Handle write-in
  if (voteData.writeInAnswer && vote.allowWriteIn) {
    if (!vote.writeInResponses) vote.writeInResponses = []
    const existing = vote.writeInResponses.find(r => r.text === voteData.writeInAnswer)
    if (existing) {
      existing.count++
    } else {
      vote.writeInResponses.push({ text: voteData.writeInAnswer, count: 1 })
    }
  }

  vote.totalVotes = (vote.totalVotes || 0) + 1
  selectedVote.value = null
}

const createPost = () => {
  showNewPostDialog.value = true
}

const handleNewPost = (postData) => {
  const post = {
    id: Date.now(),
    author: 'Current User', // Replace with actual user name
    content: postData.content,
    date: 'Just now',
    title: postData.title
  }

  if (postData.file) {
    post.file = postData.file
    post.fileName = postData.file.name
    post.fileUrl = URL.createObjectURL(postData.file)
  }

  posts.value.unshift(post)
  showNewPostDialog.value = false
}

const openVote = (voteId) => {
  selectedVote.value = votes.value.find(v => v.id === voteId)
}

const openPost = (postId) => {
  selectedPost.value = posts.value.find(p => p.id === postId)
}

const goToSettings = () => {
  showSettings.value = true
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const handleSettingsSubmit = (settings) => {
  // Update group settings
  group.value.settings = settings.settings
  group.value.members = settings.members
  showSettings.value = false
}

const sortedVotes = computed(() => {
  return [...votes.value].sort((a, b) => {
    // Sort by status first (Open before Closed)
    if (a.status !== b.status) {
      return a.status === 'Open' ? -1 : 1
    }
    // Then sort by start time (newest first)
    return new Date(b.startTime) - new Date(a.startTime)
  })
})

const handleNewGroup = (newGroup) => {
  groups.value.push(newGroup)
  group.value = newGroup
}
</script>