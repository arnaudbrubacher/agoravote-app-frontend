<!-- components/group/GroupDialogs.vue -->
<template>
  <!-- All dialogs wrapper -->
  <div>
    <!-- Group Settings Dialog -->
    <GroupSettingsDialog 
      v-if="showSettingsDialog && group"
      :group="group"
      @close="$emit('close-settings')"
      @submit="$emit('group-updated', $event)"
      @delete="$emit('group-deleted')"
      @leave="$emit('group-left')"
    />

    <!-- New Vote Dialog -->
    <NewVoteDialog
      v-if="showNewVoteDialog && group"
      :group="group"
      @close="$emit('close-new-vote')"
      @submit="$emit('vote-created', $event)"
    />

    <!-- New Post Dialog -->
    <NewPostDialog
      v-if="showNewPostDialog && group"
      :group="group"
      @close="$emit('close-new-post')"
      @submit="$emit('post-created', $event)"
    />

    <!-- Add Member Dialog -->
    <AddMemberDialog
      v-if="showAddMemberDialog && group"
      :group="group"
      @close="$emit('close-add-member')"
      @submit="$emit('member-added', $event)"
    />

    <!-- Post Details Dialog -->
    <PostDetailsDialog
      v-if="selectedPost"
      :post="selectedPost"
      :current-user-id="currentUser?.id"
      @close="$emit('close-post-details')"
      @edit="$emit('post-edited', $event)"
      @delete="$emit('post-deleted', $event)"
    />

    <!-- Vote Details Dialog -->
    <VoteDetailsDialog
      v-if="selectedVote"
      :vote="selectedVote"
      :current-user-id="currentUser?.id"
      @close="$emit('close-vote-details')"
      @submit-vote="$emit('vote-submitted', $event)"
      @delete="$emit('vote-deleted', $event)"
    />

    <!-- User Search Dialog -->
    <UserSearchDialog
      v-if="showUserSearchDialog"
      :group-id="group?.id"
      @close="$emit('close-user-search')"
      @user-added="$emit('user-added', $event)"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import GroupSettingsDialog from '@/components/group/dialogs/GroupSettingsDialog.vue'
import NewVoteDialog from '@/components/group/dialogs/NewVoteDialog.vue'
import NewPostDialog from '@/components/group/dialogs/NewPostDialog.vue'
import AddMemberDialog from '@/components/group/dialogs/AddMemberDialog.vue'
import PostDetailsDialog from '@/components/group/dialogs/PostDetailsDialog.vue'
import VoteDetailsDialog from '@/components/group/dialogs/VoteDetailsDialog.vue'
import UserSearchDialog from '@/components/group/dialogs/UserSearchDialog.vue'

const props = defineProps({
  showSettingsDialog: Boolean,
  showNewVoteDialog: Boolean,
  showNewPostDialog: Boolean,
  showAddMemberDialog: Boolean,
  showUserSearchDialog: Boolean,
  selectedPost: Object,
  selectedVote: Object,
  group: Object,
  currentUser: Object
})

defineEmits([
  'close-settings',
  'close-new-vote',
  'close-new-post',
  'close-add-member',
  'close-user-search',
  'close-post-details',
  'close-vote-details',
  'group-updated',
  'group-deleted',
  'group-left',
  'vote-created',
  'post-created',
  'member-added',
  'vote-submitted',
  'vote-deleted',
  'post-edited',
  'post-deleted',
  'user-added'
])
</script>