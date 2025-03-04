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
        @show-new-vote="$emit('create-vote')"
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
        @show-add-member="$emit('add-member')"
        @show-user-search="$emit('search-user')"
        @csv-import="$emit('csv-import', $event)"
        @member-promoted="$emit('member-promoted', $event)"
        @member-demoted="$emit('member-demoted', $event)"
        @member-removed="$emit('member-removed', $event)"
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

import VotesTab from '@/components/groups/tabs/VotesTab.vue'
import PostsTab from '@/components/groups/tabs/PostsTab.vue'
import MembersTab from '@/components/groups/tabs/MembersTab.vue'

defineProps({
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
  }
})

defineEmits([
  'create-vote',
  'create-post',
  'add-member',
  'search-user',
  'csv-import',
  'member-promoted',
  'member-demoted',
  'member-removed',
  'open-vote',
  'open-post',
  'refresh-group'
])
</script>