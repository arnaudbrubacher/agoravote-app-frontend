<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Your Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2">
          <li v-for="group in groups" :key="group.id">
            <Button 
              variant="ghost" 
              class="w-full justify-start text-left" 
              @click="openGroup(group.id)"
            >
              {{ group.name }}
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
          @click="createGroup"
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
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app-layout'
})

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const router = useRouter()

const groups = ref([
  { id: 1, name: 'Group 1' },
  { id: 2, name: 'Group 2' }
])

const searchQuery = ref('')

const openGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}

const createGroup = () => {
  // Add group creation logic
}

const searchGroups = () => {
  // Add search logic
}
</script>