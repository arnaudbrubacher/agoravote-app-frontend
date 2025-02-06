<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Your Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-4">
          <li v-for="group in groups" :key="group.id">
            <Button 
              variant="ghost" 
              class="w-full justify-start text-left p-6 min-h-[100px] border rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all"
              @click="openGroup(group.id)"
            >
              <div class="flex items-center space-x-6">
                <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="heroicons:user-group" class="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold">{{ group.name }}</h3>
                  <p class="text-sm text-muted-foreground">{{ group.members.length }} members • Last active {{ group.lastActive }}</p>
                </div>
              </div>
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          class="w-full" 
          variant="default"
          @click="showNewGroupDialog = true"
        >
          Create New Group
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Find Groups</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Input
          v-model="searchQuery"
          placeholder="Search groups..."
          type="search"
        />
        <Button 
          class="w-full"
          variant="secondary"
          @click="searchGroups"
        >
          Search
        </Button>
      </CardContent>
    </Card>

    <NewGroupDialog 
      v-if="showNewGroupDialog"
      @close="showNewGroupDialog = false"
      @submit="createGroup"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import NewGroupDialog from '@/components/NewGroupDialog.vue'

definePageMeta({
  layout: 'app-layout'
})

const router = useRouter()
const showNewGroupDialog = ref(false)
const searchQuery = ref('')

// Initialize groups array with sample data
const groups = ref([
  {
    id: 1,
    name: 'Development Team',
    description: 'Team collaboration space',
    picture: null,
    isPrivate: false,
    requiresPassword: false,
    password: '',
    members: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    votes: [
      { id: 1, title: 'Feature A', status: 'Open' },
      { id: 2, title: 'Feature B', status: 'Closed' }
    ],
    posts: [
      { id: 1, author: 'Alice', date: '2h ago', content: 'Discussion about Feature A' },
      { id: 2, author: 'Bob', date: '1h ago', content: 'Discussion about Feature B' }
    ],
    lastActive: '2h ago'
  },
  {
    id: 2,
    name: 'Marketing Team',
    description: 'Marketing strategies and discussions',
    picture: null,
    isPrivate: true,
    requiresPassword: true,
    password: 'secret',
    members: [{ id: 3, name: 'Charlie' }, { id: 4, name: 'Dave' }],
    votes: [
      { id: 3, title: 'Campaign A', status: 'Open' },
      { id: 4, title: 'Campaign B', status: 'Closed' }
    ],
    posts: [
      { id: 3, author: 'Charlie', date: '3h ago', content: 'Discussion about Campaign A' },
      { id: 4, author: 'Dave', date: '2h ago', content: 'Discussion about Campaign B' }
    ],
    lastActive: '1h ago'
  }
])

const createGroup = (groupData) => {
  // Create new group object
  const newGroup = {
    id: Date.now(),
    name: groupData.name,
    description: groupData.description || '',
    picture: groupData.picture || null,
    isPrivate: groupData.isPrivate,
    requiresPassword: groupData.requiresPassword,
    password: groupData.password || '',
    members: [], // Start empty
    votes: [],   // Start empty
    posts: [],   // Start empty
    lastActive: 'Just now'
  }

  // Add to start of groups array
  groups.value.unshift(newGroup)
  
  // Close dialog
  showNewGroupDialog.value = false
  
  // Navigate with state
  router.push({
    path: `/group/${newGroup.id}`,
    state: { group: newGroup }
  })
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

const searchGroups = () => {
  // Add search functionality
}
</script>