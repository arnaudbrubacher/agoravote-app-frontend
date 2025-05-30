<template>
  <div class="space-y-4">
    <!-- Header with title and optional create button -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Votes</h3>
      <div v-if="showCreateButton">
        <TooltipProvider v-if="createButtonDisabled">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button 
                variant="outline" 
                size="sm"
                :disabled="createButtonDisabled"
                @click="!createButtonDisabled && $emit('create-vote')"
              >
                <Plus class="h-4 w-4" />
                <Vote class="h-4 w-4 mr-1" />
                New Vote
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ disabledTooltipMessage || 'Only group administrators can create votes in this group' }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button 
          v-else
          variant="outline" 
          size="sm"
          @click="$emit('create-vote')"
        >
          <Plus class="h-4 w-4" />
          <Vote class="h-4 w-4 mr-1" />
          New Vote
        </Button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading votes...</span>
    </div>
    
    <!-- No votes state -->
    <div v-else-if="votes.length === 0" class="text-center py-8 text-muted-foreground">
      No votes yet. Create a vote for your group to decide on something!
    </div>
    
    <!-- Votes list -->
    <div v-else class="space-y-4">
      <VoteCard 
        v-for="vote in votes" 
        :key="vote.id" 
        :vote="vote" 
        @click="$emit('open-vote', vote)"
      />
    </div>
  </div>
</template>

<script setup>
import { Plus, Vote } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import LucideIcon from '@/components/LucideIcon.vue'
import VoteCard from '~/components/votes/VoteCard.vue'

const props = defineProps({
  votes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showCreateButton: {
    type: Boolean,
    default: false
  },
  createButtonDisabled: {
    type: Boolean,
    default: false
  },
  disabledTooltipMessage: {
    type: String,
    default: ''
  }
})

defineEmits(['create-vote', 'open-vote'])
</script>
