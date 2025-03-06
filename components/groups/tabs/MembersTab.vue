<!-- components/group/tabs/MembersTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
      <!-- Use the shared MembersList component which handles lists of members -->
      <MembersList
        :members="group.members"
        :loading="isLoadingMembers"
        :current-user="currentUser"
        :is-current-user-admin="isCurrentUserAdmin"
        :show-add-button="true"
        :show-import-button="true"
        @add-member="$emit('show-add-member')"
        @search-user="$emit('show-user-search')"
        @import-csv="triggerCsvFileInput"
        @promote="promoteMember"
        @demote="demoteMember"
        @remove="removeMember"
        @refresh-members="$emit('refresh-group')"
        @admin-status-update="handleAdminStatusUpdate"
      />
      <input
        type="file"
        ref="csvFileInput"
        class="hidden"
        accept=".csv"
        @change="handleFileChange"
      />
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import MembersList from '~/components/members/MembersList.vue'

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
  }
})

// Debug admin status
onMounted(() => {
  console.log('MembersTab - isCurrentUserAdmin:', props.isCurrentUserAdmin)
  console.log('MembersTab - group:', props.group)
})

// Watch for changes in the isCurrentUserAdmin prop
watch(() => props.isCurrentUserAdmin, (newValue) => {
  console.log('MembersTab - isCurrentUserAdmin changed to:', newValue)
})

const emit = defineEmits([
  'show-add-member', 
  'show-user-search', 
  'csv-import',
  'member-promoted',
  'member-demoted',
  'member-removed',
  'refresh-group',
  'admin-status-update'
])

const csvFileInput = ref(null)
const isLoadingMembers = ref(false)

const triggerCsvFileInput = () => {
  csvFileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('csv-import', file)
  }
  // Reset input
  event.target.value = ''
}

const promoteMember = (member) => {
  emit('member-promoted', member)
}

const demoteMember = (member) => {
  emit('member-demoted', member)
}

const removeMember = (member) => {
  console.log('MembersTab - Member removal event received for:', member.name, {
    id: member.id,
    userId: member.userId,
    user_id: member.user_id,
    user: member.user && member.user.id
  });
  emit('member-removed', member);
}

const handleAdminStatusUpdate = (isAdmin) => {
  console.log('MembersTab received admin status update:', isAdmin)
  emit('admin-status-update', isAdmin)
}
</script>