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

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const settings = ref({
  postsPermission: props.group.settings?.postsPermission || 'admins',
  votesPermission: props.group.settings?.votesPermission || 'admins'
})

const toggleAdmin = (member) => {
  member.role = member.role === 'Admin' ? 'Member' : 'Admin'
}

const handleSubmit = () => {
  emit('submit', {
    settings: settings.value,
    members: props.group.members
  })
}

defineEmits(['close', 'submit'])
</script>