<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Group Settings</DialogTitle>
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto pr-1">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Group Picture -->
          <div class="flex justify-center mb-8">
            <div class="relative">
              <div v-if="!groupData.picture" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name="heroicons:user-group" class="h-16 w-16 text-gray-400" />
              </div>
              <img 
                v-else
                :src="groupData.picture" 
                alt="Group Picture"
                class="w-28 h-28 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                class="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                @click="triggerFileInput"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
              <input 
                type="file" 
                ref="fileInput" 
                class="hidden"
                accept="image/*" 
                @change="handleImageChange" 
              />
            </div>
          </div>
          
          <!-- Group Name -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="group-name" class="text-sm text-muted-foreground">Group Name</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="editingName = !editingName"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingName">
              <Input
                id="group-name"
                v-model="groupData.name"
                placeholder="Enter group name"
              />
            </div>
            <div v-else class="px-3 py-2 text-lg font-medium">
              {{ groupData.name }}
            </div>
          </div>
          
          <!-- Group Description -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="group-description" class="text-sm text-muted-foreground">Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="editingDescription = !editingDescription"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingDescription">
              <Textarea
                id="group-description"
                v-model="groupData.description"
                placeholder="Enter group description"
                class="h-24"
              />
            </div>
            <div v-else class="px-3 py-2">
              <p class="text-base">{{ groupData.description || 'No description' }}</p>
            </div>
          </div>
          
          <!-- Creation Date -->
          <div class="text-sm text-muted-foreground">
            Created {{ formatDate(props.group.created_at) }}
          </div>
          
          <!-- Privacy Setting -->
          <div class="space-y-2">
            <Label>Group Privacy</Label>
            <RadioGroup v-model="groupData.is_private">
              <div class="flex items-center space-x-2 mb-2">
                <RadioGroupItem :value="false" id="public-group" />
                <Label for="public-group" class="flex items-center space-x-2 cursor-pointer">
                  <UnlockIcon class="h-4 w-4" />
                  <span>Public Group</span>
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem :value="true" id="private-group" />
                <Label for="private-group" class="flex items-center space-x-2 cursor-pointer">
                  <LockIcon class="h-4 w-4" />
                  <span>Private Group</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <!-- Separator -->
          <Separator />

          <!-- Posts Permissions -->
          <div class="space-y-4">
            <Label class="text-base font-semibold">Posts Permissions</Label>
            <RadioGroup v-model="settings.postsPermission">
              <div class="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="admins" id="posts-admins" />
                <Label for="posts-admins" class="cursor-pointer">Only Admins</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="members" id="posts-members" />
                <Label for="posts-members" class="cursor-pointer">All Members</Label>
              </div>
            </RadioGroup>
          </div>

          <!-- Votes Permissions -->
          <div class="space-y-4">
            <Label class="text-base font-semibold">Votes Permissions</Label>
            <RadioGroup v-model="settings.votesPermission">
              <div class="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="admins" id="votes-admins" />
                <Label for="votes-admins" class="cursor-pointer">Only Admins</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="members" id="votes-members" />
                <Label for="votes-members" class="cursor-pointer">All Members</Label>
              </div>
            </RadioGroup>
          </div>
        </form>

        <!-- Danger Zone -->
        <div class="mt-8 pt-6 border-t border-destructive/20">
          <h3 class="text-base font-semibold text-destructive mb-4">Danger Zone</h3>
          <Button 
            variant="destructive" 
            class="w-full"
            @click="confirmDelete"
          >
            <TrashIcon class="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('close')">Cancel</Button>
        <Button @click="handleSubmit">Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { LockIcon, UnlockIcon, TrashIcon, EditIcon } from 'lucide-vue-next'
import { Icon } from '@iconify/vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const fileInput = ref(null)
const editingName = ref(false)
const editingDescription = ref(false)

const groupData = ref({
  name: props.group.name,
  description: props.group.description,
  picture: props.group.picture,
  is_private: props.group.is_private
})

const settings = ref({
  postsPermission: props.group.settings?.postsPermission || 'admins',
  votesPermission: props.group.settings?.votesPermission || 'admins'
})

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return date.toLocaleDateString(undefined, options)
  } catch (err) {
    console.error('Error formatting date:', dateString, err)
    return 'Invalid date'
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleImageChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      groupData.value.picture = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const confirmDelete = () => {
  if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    emit('delete')
  }
}

const handleSubmit = () => {
  emit('submit', {
    name: groupData.value.name,
    description: groupData.value.description,
    picture: groupData.value.picture,
    is_private: groupData.value.is_private,
    settings: settings.value
  })
}

const emit = defineEmits(['close', 'submit', 'delete'])
</script>