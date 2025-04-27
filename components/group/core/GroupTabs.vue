<!-- components/group/GroupTabs.vue -->
<template>
  <Tabs defaultValue="votes" class="w-full">
    <TabsList>
      <TabsTrigger value="votes">Votes</TabsTrigger>
      <TabsTrigger value="posts">Posts</TabsTrigger>
      <TabsTrigger value="members">Members</TabsTrigger>
    </TabsList>

    <!-- Votes Tab -->
    <TabsContent value="votes">
      <VotesTab 
        :group="group" 
        :current-user="currentUser" 
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
  </Tabs>
</template>

<script setup>
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'
import { onMounted, watch } from 'vue'

import VotesTab from '@/components/groups/tabs/VotesTab.vue'
import PostsTab from '@/components/groups/tabs/PostsTab.vue'
import MembersTab from '@/components/groups/tabs/MembersTab.vue'

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
  }
})

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
  'invite-member-by-email'
])
</script>