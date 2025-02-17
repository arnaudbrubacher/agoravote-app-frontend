<template>
  <div class="space-y-6">
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
import * as HeroIcons from '@heroicons/vue/outline'
import axios from 'axios'

definePageMeta({
  layout: 'app-layout'
})

const router = useRouter()
const showNewGroupDialog = ref(false)
const showAdmissionForm = ref(false)
const searchQuery = ref('')
const selectedGroup = ref(null)

const groups = ref([])

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:8080/groups')
    console.log('Fetched groups:', response.data) // Debugging statement
    groups.value = response.data
  } catch (error) {
    console.error('Error fetching groups:', error)
  }
})

const userId = 1 // Example user ID

const userGroups = computed(() => {
  const filteredGroups = groups.value.filter(group => group.members.includes(userId))
  console.log('User groups:', filteredGroups) // Debugging statement
  return filteredGroups
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
</script>

<style>
/* Your styles here */
</style>