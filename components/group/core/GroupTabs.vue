<!-- components/group/GroupTabs.vue -->
<!-- 
  This component renders the main tabs for a group page.
  Settings tab is now always visible to all users, but functionality is limited for non-admins.
  Non-admin users will see disabled/greyed out settings with a notice explaining they are in read-only mode.
-->
<template>
  <Tabs :modelValue="props.modelValue" @update:modelValue="handleTabChange" class="w-full">
    <TabsList class="grid w-full rounded-md p-1 gap-1" :style="`grid-template-columns: repeat(${tabCount}, minmax(0, 1fr))`">
      <TabsTrigger value="votes" class="flex items-center justify-center border border-transparent data-[state=active]:border-primary data-[state=inactive]:border-border data-[state=inactive]:border">
        <span class="flex items-center">
          <Vote class="h-4 w-4 mr-2" />
          Votes
        </span>
      </TabsTrigger>
      <TabsTrigger value="posts" class="flex items-center justify-center border border-transparent data-[state=active]:border-primary data-[state=inactive]:border-border data-[state=inactive]:border">
        <span class="flex items-center">
          <Newspaper class="h-4 w-4 mr-2" />
          Posts
        </span>
      </TabsTrigger>
      <TabsTrigger value="members" class="flex items-center justify-center border border-transparent data-[state=active]:border-primary data-[state=inactive]:border-border data-[state=inactive]:border">
        <span class="flex items-center">
          <Users class="h-4 w-4 mr-2" />
          Members
        </span>
      </TabsTrigger>
      <TabsTrigger value="settings" class="flex items-center justify-center border border-transparent data-[state=active]:border-primary data-[state=inactive]:border-border data-[state=inactive]:border">
        <span class="flex items-center">
          <Settings class="h-4 w-4 mr-2" />
          Settings
        </span>
      </TabsTrigger>
    </TabsList>

    <!-- Votes Tab -->
    <TabsContent value="votes">
      <VotesTab 
        :group="group" 
        :current-user="currentUser" 
        :is-current-user-admin="isCurrentUserAdmin"
        :votes="votes"
        :loading="isLoadingVotes"
        @create-vote="$emit('create-vote')"
        @open-vote="$emit('open-vote', $event)"
      />
    </TabsContent>

    <!-- Posts Tab -->
    <TabsContent value="posts">
      <PostsTab 
        :group="group" 
        :current-user="currentUser" 
        :is-current-user-admin="isCurrentUserAdmin"
        @show-new-post="$emit('create-post')"
        @open-post="$emit('open-post', $event)"
      />
    </TabsContent>

    <!-- Members Tab -->
    <TabsContent value="members">
      <MembersTab 
        :group="group" 
        :current-user="currentUser" 
        :is-current-user-admin="isCurrentUserAdmin"
        :fetchGroup="fetchGroup"
        @show-add-member="$emit('add-member')"
        @show-user-search="$emit('search-user')"
        @csv-import="$emit('csv-import', $event)"
        @member-promoted="$emit('member-promoted', $event)"
        @member-demoted="$emit('member-demoted', $event)"
        @refresh-group="$emit('refresh-group')"
        @admin-status-update="$emit('admin-status-update', $event)"
        @invite-member="$emit('invite-member', $event)"
        @invite-member-by-email="$emit('invite-member-by-email', $event)"
      />
    </TabsContent>

    <!-- Settings Tab (Shown to all users, but functionality limited for non-admins) -->
    <TabsContent value="settings">
      <SettingsTab
        :group="group"
        :is-current-user-admin="isCurrentUserAdmin"
        :fetch-group="fetchGroup"
        :is-deleting-group="isDeletingGroup"
        @group-updated="$emit('group-updated', $event)"
        @group-deleted="$emit('group-deleted')"
      />
    </TabsContent>
  </Tabs>
</template>

<script setup>
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'
import { computed, onMounted, watch } from 'vue'
import { Vote, Newspaper, Users, Settings } from 'lucide-vue-next'

import VotesTab from '@/components/groups/tabs/VotesTab.vue'
import PostsTab from '@/components/groups/tabs/PostsTab.vue'
import MembersTab from '@/components/groups/tabs/MembersTab.vue'
import SettingsTab from '@/components/groups/tabs/SettingsTab.vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  posts: {
    type: Array,
    default: () => []
  },
  votes: {
    type: Array,
    default: () => []
  },
  isLoadingVotes: {
    type: Boolean,
    default: false
  },
  fetchGroup: {
    type: Function,
    required: true
  },
  modelValue: {
    type: String,
    required: true 
  },
  isDeletingGroup: {
    type: Boolean,
    default: false
  }
})

// Calculate the number of tabs dynamically
const tabCount = computed(() => {
  return 4; // Always show all 4 tabs
});

// Debug admin status
onMounted(() => {
  console.log('GroupTabs - isCurrentUserAdmin:', props.isCurrentUserAdmin)
})

// Watch for changes in the isCurrentUserAdmin prop
watch(() => props.isCurrentUserAdmin, (newValue) => {
  console.log('GroupTabs - isCurrentUserAdmin changed to:', newValue)
})

const emit = defineEmits([
  'create-vote',
  'create-post',
  'add-member',
  'search-user',
  'csv-import',
  'member-promoted',
  'member-demoted',
  'open-vote',
  'open-post',
  'refresh-group',
  'admin-status-update',
  'invite-member',
  'invite-member-by-email',
  'group-updated',
  'group-deleted',
  'update:modelValue'
])

// Function to emit the update event when the tab changes
const handleTabChange = (newValue) => {
  emit('update:modelValue', newValue)
}
</script>