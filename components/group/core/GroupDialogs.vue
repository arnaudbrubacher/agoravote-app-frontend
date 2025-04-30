<!-- components/group/GroupDialogs.vue -->
<template>
  <!-- All dialogs wrapper -->
  <div>
    <!-- Group Settings Dialog -->
    <GroupSettingsDialog 
      v-if="showSettingsDialog && group"
      :group="group"
      :is-current-user-admin="isCurrentUserAdmin"
      @close="$emit('close-settings')"
      @submit="$emit('group-updated', $event)"
      @delete="$emit('group-deleted')"
    />

    <!-- New Vote Dialog -->
    <NewVoteDialog
      v-if="showNewVoteDialog && group"
      :group="group"
      @close="$emit('close-new-vote')"
      @submit="$emit('vote-created', $event)"
      :is-creating-vote="props.isCreatingVote"
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
      :user-tracker-hash="userTrackerHash"
      :encrypted-ballot-data="encryptedBallotData"
      :is-encrypting="isEncrypting"
      :is-submitting="isSubmitting"
      :spoiled-selection-details="spoiledSelectionDetails"
      :is-deleting-vote="props.isDeletingVote"
      :is-loading-details="props.isLoadingDetails"
      @close="$emit('close-vote-details')"
      @delete="$emit('vote-deleted', $event)"
      @encrypt-vote="$emit('encrypt-vote', $event)"
      @cast-vote="$emit('cast-vote', $event)"
      @spoil-vote="$emit('spoil-vote', $event)"
      @clear-spoiled-details="$emit('clear-spoiled-details')"
      @end-vote="$emit('end-vote', $event)"
      @tally-decrypt="$emit('tally-decrypt', $event)"
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
import { defineProps, defineEmits, watch } from 'vue'
import GroupSettingsDialog from '~/components/groups/GroupSettingsDialog.vue'
import NewVoteDialog from '~/components/votes/NewVoteDialog.vue'
import NewPostDialog from '~/components/posts/NewPostDialog.vue'
import InviteMemberDialog from '~/components/members/InviteMemberDialog.vue'
import PostDetailsDialog from '~/components/posts/PostDetailsDialog.vue'
import VoteDetailsDialog from '~/components/votes/VoteDetailsDialog.vue'
import UserSearchDialog from '~/components/users/UserSearchDialog.vue'

const props = defineProps({
  showSettingsDialog: Boolean,
  showNewVoteDialog: Boolean,
  showNewPostDialog: Boolean,
  showAddMemberDialog: Boolean,
  showUserSearchDialog: Boolean,
  showVoteDetails: Boolean,
  isCreatingVote: Boolean,
  isLoadingDetails: Boolean,
  isDeletingVote: Boolean,
  selectedPost: Object,
  selectedVote: Object,
  group: Object,
  currentUser: Object,
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  userTrackerHash: String,
  encryptedBallotData: Object,
  isEncrypting: Boolean,
  isSubmitting: Boolean,
  spoiledSelectionDetails: Object
})

// Add a watcher to log the prop value when it changes
watch(() => props.selectedVote, (newValue, oldValue) => {
  console.log(`[GroupDialogs.vue] selectedVote prop changed:`, {
    oldValue,
    newValue,
    isTruthy: !!newValue
  });
});

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
  'vote-created',
  'post-created',
  'member-added',
  'vote-submitted',
  'vote-deleted',
  'post-edited',
  'post-deleted',
  'user-added',
  'encrypt-vote',
  'cast-vote',
  'spoil-vote',
  'clear-spoiled-details',
  'end-vote',
  'tally-decrypt'
])
</script>