<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" @click="goToDashboard" class="p-2 border">
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

// Initialize with default values
const group = ref({
  id: `group-${Date.now()}`, // Unique timestamp-based ID
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

// Add reactive ref for dialog visibility
const showNewVoteDialog = ref(false)
const selectedVote = ref(null)
const selectedPost = ref(null)
const showNewPostDialog = ref(false)
const showSettings = ref(false)

onMounted(async () => {
  try {
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

const addMember = () => {
  // Add member logic
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
</script>