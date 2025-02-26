<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col h-[90vh]">
        <header class="flex justify-between items-center p-6 border-b">
          <h2 class="text-lg font-semibold">Group Settings</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6">
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
                <input
                  id="group-name"
                  v-model="groupData.name"
                  class="w-full px-3 py-2 border rounded-md"
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
                <textarea
                  id="group-description"
                  v-model="groupData.description"
                  class="w-full px-3 py-2 border rounded-md h-24"
                  placeholder="Enter group description"
                ></textarea>
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
              <div class="flex items-center space-x-2">
                <input
                  type="radio"
                  id="public-group"
                  v-model="groupData.is_private"
                  :value="false"
                />
                <label for="public-group" class="flex items-center space-x-2">
                  <UnlockIcon class="h-4 w-4" />
                  <span>Public Group</span>
                </label>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  type="radio"
                  id="private-group"
                  v-model="groupData.is_private"
                  :value="true"
                />
                <label for="private-group" class="flex items-center space-x-2">
                  <LockIcon class="h-4 w-4" />
                  <span>Private Group</span>
                </label>
              </div>
            </div>

            <!-- Separator -->
            <div class="border-t my-4"></div>

            <!-- Posts Permissions -->
            <div class="space-y-4">
              <Label class="text-base font-semibold">Posts Permissions</Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="posts-admins"
                    v-model="settings.postsPermission"
                    value="admins"
                  />
                  <label for="posts-admins">Only Admins</label>
                </div>
                <div class="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="posts-members"
                    v-model="settings.postsPermission"
                    value="members"
                  />
                  <label for="posts-members">All Members</label>
                </div>
              </div>
            </div>

            <!-- Votes Permissions -->
            <div class="space-y-4">
              <Label class="text-base font-semibold">Votes Permissions</Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="votes-admins"
                    v-model="settings.votesPermission"
                    value="admins"
                  />
                  <label for="votes-admins">Only Admins</label>
                </div>
                <div class="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="votes-members"
                    v-model="settings.votesPermission"
                    value="members"
                  />
                  <label for="votes-members">All Members</label>
                </div>
              </div>
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

        <footer class="p-6 border-t">
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="$emit('close')">Cancel</Button>
            <Button @click="handleSubmit">Save Changes</Button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
    emit('delete')  // Use the emit function returned by defineEmits()
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