<template>
  <div class="mt-6 pt-4 border-t">
    <!-- State 1: Already Voted -->
    <div v-if="hasUserVoted" class="space-y-3 text-center p-4 bg-green-50 border border-green-200 rounded-md">
      <LucideIcon name="CheckCircle" class="mx-auto h-10 w-10 text-green-500" />
      <p class="font-medium text-green-800">You have already cast your ballot in this election.</p>
      <p class="text-sm text-muted-foreground">Your ballot tracking hash is:</p>
      <code class="block text-sm font-mono bg-gray-100 p-2 rounded break-all">{{ userTrackerHash }}</code>
      <p class="text-xs text-muted-foreground pt-2">
        You can use this hash later to verify your vote was included in the final tally (verification feature coming soon).
      </p>
    </div>

    <!-- State 2: Ballot Encrypted, Ready to Cast/Spoil -->
    <div v-else-if="encryptedBallotData" class="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div class="flex items-center justify-center space-x-2">
            <LucideIcon name="ShieldCheck" class="h-8 w-8 text-blue-600" />
             <h4 class="text-lg font-medium text-blue-800">Ballot Encrypted</h4>
        </div>
        <p class="text-sm text-center text-muted-foreground">Your selection has been securely encrypted. You can now choose to cast or spoil your ballot.</p>
        <p class="text-sm text-muted-foreground">Your unique ballot tracking hash is:</p>
        <code class="block text-sm font-mono bg-gray-100 p-2 rounded break-all">{{ encryptedBallotData?.tracker_hash || 'Generating...' }}</code>
        <p class="text-xs text-muted-foreground pt-2">Keep this hash safe. You can use it later to verify your ballot.</p>
        <div class="flex justify-center space-x-4 pt-4">
            <Button
                variant="outline"
                @click="handleSpoil"
                :disabled="isSubmitting"
            >
                 <LucideIcon v-if="isSubmitting && actionType === 'spoil'" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                <LucideIcon v-else name="Trash2" size="4" class="h-4 w-4 mr-2" />
                Spoil Ballot
            </Button>
            <Button
                @click="handleCast"
                :disabled="isSubmitting"
            >
                <LucideIcon v-if="isSubmitting && actionType === 'cast'" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                 <LucideIcon v-else name="Send" size="4" class="h-4 w-4 mr-2" />
                Cast Ballot
            </Button>
        </div>
    </div>

    <!-- State 3: Spoiled Ballot Confirmation -->
    <div v-else-if="spoiledSelectionDetails" class="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
        <div class="flex items-center justify-center space-x-2">
            <LucideIcon name="AlertTriangle" class="h-8 w-8 text-orange-600" />
            <h4 class="text-lg font-medium text-orange-800">Ballot Spoiled</h4>
        </div>
        <p class="text-sm text-center text-muted-foreground">Your ballot was successfully spoiled. Here is the selection you made:</p>
        <div class="p-3 bg-white border rounded-md space-y-1">
            <p class="text-sm font-medium">Selected Choice:</p>
            <p class="text-sm text-gray-700">{{ getChoiceText(spoiledSelectionDetails.choiceId) || 'N/A' }}</p>
            <div v-if="vote.allowWriteIn">
                <p class="text-sm font-medium mt-2">Write-in:</p>
                <p class="text-sm text-gray-700">{{ spoiledSelectionDetails.writeIn || '-' }}</p>
            </div>
        </div>
        <p class="text-xs text-muted-foreground text-center pt-2">This spoiled ballot will NOT be counted.</p>
        <div class="flex justify-center pt-4">
            <Button @click="clearSpoiledDetails">
                <LucideIcon name="RotateCcw" size="4" class="h-4 w-4 mr-2" />
                Vote Again
            </Button>
        </div>
    </div>

    <!-- State 4: Ready to Vote (Select and Encrypt) -->
    <form v-else @submit.prevent="handleEncrypt" class="space-y-4">
        <h4 class="font-medium">Cast your vote</h4>
        <RadioGroup v-model="selectedEgChoiceId" class="space-y-2">
            <div v-for="(choice, index) in vote.choices" :key="getEgSelectionId(vote.id, index)" class="flex items-center space-x-2">
                <RadioGroupItem
                    :id="`choice-${vote.id}-${index}`"
                    :value="getEgSelectionId(vote.id, index)"
                    :disabled="!canVote || isEncrypting"
                />
                <Label :for="`choice-${vote.id}-${index}`">{{ choice.text }}</Label>
            </div>
        </RadioGroup>

        <div v-if="vote.allowWriteIn" class="space-y-2">
            <Label>Write-in Answer (Optional)</Label>
            <Input
                v-model="writeInAnswer"
                placeholder="Enter your answer"
                :disabled="!canVote || isEncrypting"
             />
        </div>

        <div class="flex justify-end">
            <Button
                type="submit"
                :disabled="!canVote || !isValidSelection || isEncrypting"
            >
                <LucideIcon v-if="isEncrypting" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                <LucideIcon v-else name="Lock" size="4" class="h-4 w-4 mr-2" />
                Encrypt Vote
            </Button>
        </div>
         <p v-if="!canVote" class="text-sm text-red-600 text-right pt-1">You are not eligible to vote in this election.</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const props = defineProps({
  vote: {
    type: Object,
    required: true
  },
  canVote: {
      type: Boolean,
      default: false
  },
  userTrackerHash: {
    type: String,
    default: null
  },
  encryptedBallotData: { // Passed from parent, contains encrypted ballot info + tracker hash
     type: Object, // Expecting { encrypted_ballot: string, tracker_hash: string } or similar
     default: null
  },
  isEncrypting: { // Loading state for encryption call
      type: Boolean,
      default: false
  },
  isSubmitting: { // Loading state for cast/spoil call
      type: Boolean,
      default: false
  },
  spoiledSelectionDetails: { // Details of the successfully spoiled ballot
      type: Object, // Expecting { choiceId: string, writeIn: string | null }
      default: null
  }
})

const emit = defineEmits([
    'encrypt-vote',
    'cast-vote',
    'spoil-vote',
    // 'update:encryptedBallotData', // No longer needed
    'clear-spoiled-details' // To clear the spoiled confirmation state
])

// Local State
const selectedEgChoiceId = ref(null)
const writeInAnswer = ref('')
const actionType = ref(null) // 'cast' or 'spoil' to show spinner on correct button

// Computed Properties
const hasUserVoted = computed(() => {
  // Consider a user to have voted if they have a tracker hash *and* no encrypted data pending
  // This handles the case where encryption succeeds but casting fails/is interrupted.
  return !!props.userTrackerHash && !props.encryptedBallotData;
});

const isValidSelection = computed(() => {
  // A selection is valid if a radio button is chosen.
  // Write-in is optional unless it's the *only* option (edge case, assumed not possible via UI)
  return !!selectedEgChoiceId.value;
})

// Methods
const getEgSelectionId = (voteId, index) => {
  // Consistent with backend manifest generation (1-based index)
  return `selection-${voteId}-${index + 1}`;
};

const handleEncrypt = () => {
  console.log('[BallotForm] handleEncrypt called.'); // Log entry
  console.log('[BallotForm] isValidSelection:', isValidSelection.value); // Log state
  console.log('[BallotForm] canVote:', props.canVote); // Log prop state
  console.log('[BallotForm] isEncrypting:', props.isEncrypting); // Log prop state
  if (!isValidSelection.value) {
      console.log('[BallotForm] Encryption blocked: Invalid selection.');
      return;
  }
  if (!props.canVote) {
    console.log('[BallotForm] Encryption blocked: User cannot vote.');
    return; // Add explicit return if user cannot vote
  }
   if (props.isEncrypting) {
    console.log('[BallotForm] Encryption blocked: Already encrypting.');
    return; // Add explicit return if already encrypting
  }
  console.log("[BallotForm] Emitting encrypt-vote with:", {
      selectedEgChoiceId: selectedEgChoiceId.value,
      writeIn: props.vote.allowWriteIn ? writeInAnswer.value : undefined,
      voteId: props.vote.id
  });
  emit('encrypt-vote', {
      selectedEgChoiceId: selectedEgChoiceId.value,
      writeIn: props.vote.allowWriteIn ? writeInAnswer.value : undefined,
      voteId: props.vote.id
  });
}

const handleCast = () => {
    if (!props.encryptedBallotData) return;
    actionType.value = 'cast';
    console.log("[BallotForm] Emitting cast-vote with encrypted data");
    emit('cast-vote', props.encryptedBallotData);
}

const handleSpoil = () => {
    if (!props.encryptedBallotData) return;
    actionType.value = 'spoil';
     console.log("[BallotForm] Emitting spoil-vote with encrypted data and plaintext selection");
     // Include plaintext selection in the payload
    emit('spoil-vote', {
        encryptedData: props.encryptedBallotData, 
        plaintextSelection: {
            choiceId: selectedEgChoiceId.value,
            writeIn: writeInAnswer.value
        }
    });
}

// Method to get choice text from ID
const getChoiceText = (choiceId) => {
    const choiceIndex = parseInt(choiceId.split('-').pop()) - 1; // Get index from e.g., "selection-55-1"
    return props.vote.choices?.[choiceIndex]?.text;
}

// Method to emit event to clear spoiled state
const clearSpoiledDetails = () => {
    console.log("[BallotForm] Emitting clear-spoiled-details");
    emit('clear-spoiled-details');
}

// Reset action type when submission stops
watch(() => props.isSubmitting, (newValue) => {
    if (!newValue) {
        actionType.value = null;
    }
});

</script> 