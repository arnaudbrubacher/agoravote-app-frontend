<template>
  <div class="mt-6 pt-4 border-t">
    <!-- State 1: Already Voted -->
    <div v-if="hasUserVoted" class="space-y-3 text-center p-4 bg-green-50 border border-green-200 rounded-md">
      <LucideIcon name="CheckCircle" class="mx-auto h-10 w-10 text-green-500" />
      <p class="font-medium text-green-800">You have cast your ballot in this election.</p>
      <p class="text-sm text-muted-foreground">Your tracker hash is:</p>
      <div class="flex items-center justify-center space-x-2">
          <code class="flex-grow text-sm font-mono bg-gray-100 p-2 rounded break-all text-left">{{ userTrackerHash }}</code>
          <Button variant="ghost" size="icon" @click="copyToClipboard(userTrackerHash, 'copyBtnVoted')">
              <LucideIcon :name="copyStatus.copyBtnVoted === 'copied' ? 'Check' : 'Copy'" size="4" class="h-4 w-4" />
          </Button>
      </div>
      <p class="text-xs text-muted-foreground pt-2">
        You can use this hash later to verify your vote was included in the final tally (verification feature coming soon).
      </p>
    </div>

    <!-- State 2: Ballot Encrypted, Ready to Cast/Spoil - SIMPLIFIED -->
    <div v-else-if="encryptedBallotData" class="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div class="flex items-center justify-center space-x-2">
            <LucideIcon name="ShieldCheck" class="h-8 w-8 text-blue-600" />
            <h4 class="text-lg font-medium text-blue-800">Ballot Encrypted</h4>
        </div>
        <p class="text-sm text-center text-muted-foreground">Your selection has been securely encrypted.</p>
        
        <div class="flex flex-col items-center space-y-3 pt-4">
            <Button
                @click="handleCast"
                :disabled="isSubmitting"
            >
                <LucideIcon v-if="isSubmitting && actionType === 'cast'" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                <LucideIcon v-else name="Send" size="4" class="h-4 w-4 mr-2" />
                Cast Ballot
            </Button>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <LucideIcon name="InfoIcon" size="4" class="h-4 w-4 mr-2" />
                        Understand ElectionGuard Voting Security
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                    <div class="space-y-3">
                        <h5 class="font-medium">ElectionGuard End-to-End Verifiable Voting</h5>
                        <p class="text-xs text-muted-foreground">Your ballot is secured using ElectionGuard cryptography</p>
                        
                        <div class="space-y-2">
                            <p class="text-sm text-muted-foreground">Your unique ballot tracking hash is:</p>
                            <div class="flex items-center space-x-2">
                                <code class="flex-grow text-xs font-mono bg-gray-100 p-2 rounded break-all text-left">{{ encryptedBallotData?.tracker_hash || 'Generating...' }}</code>
                                <Button variant="ghost" size="icon" @click="copyToClipboard(encryptedBallotData?.tracker_hash, 'copyBtnEncrypted')" :disabled="!encryptedBallotData?.tracker_hash">
                                    <LucideIcon :name="copyStatus.copyBtnEncrypted === 'copied' ? 'Check' : 'Copy'" size="4" class="h-4 w-4" />
                                </Button>
                            </div>
                            <p class="text-xs text-muted-foreground">Keep this hash safe. You can use it later to verify your ballot.</p>
                        </div>
                        
                        <div class="text-xs text-muted-foreground space-y-1">
                            <p>You can choose to:</p>
                            <p><strong>Cast</strong> - Submit your encrypted ballot to be counted</p>
                            <p><strong>Spoil</strong> - Cancel this ballot and vote again</p>
                        </div>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            @click="handleSpoil"
                            :disabled="isSubmitting"
                            class="w-full"
                        >
                            <LucideIcon v-if="isSubmitting && actionType === 'spoil'" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                            <LucideIcon v-else name="Trash2" size="4" class="h-4 w-4 mr-2" />
                            Spoil Ballot
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
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
    <div v-else class="mt-6 pt-4 border-t">
        <div class="flex items-center space-x-2 mb-4">
            <LucideIcon name="Vote" class="h-5 w-5 text-green-600" />
            <h4 class="font-medium text-green-800">Cast Your Vote</h4>
        </div>
        
        <div class="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
            <p class="text-sm text-green-800 font-medium">Voting is now open!</p>
            <p class="text-xs text-muted-foreground mt-1">
                Select your choice below and encrypt your ballot. Your vote will be secured using ElectionGuard cryptography.
            </p>
        </div>

        <form @submit.prevent="handleEncrypt" class="space-y-4">
            <div class="space-y-3">
                <h5 class="font-medium text-sm text-muted-foreground">Voting Options</h5>
                <RadioGroup v-model="selectedEgChoiceId" class="space-y-2">
                    <div v-for="(choice, index) in vote.choices" :key="getEgSelectionId(vote.id, index)" 
                         class="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-md hover:border-green-300 transition-colors"
                         :class="{ 'border-green-500 bg-green-50': selectedEgChoiceId === getEgSelectionId(vote.id, index) }">
                        <RadioGroupItem
                            :id="`choice-${vote.id}-${index}`"
                            :value="getEgSelectionId(vote.id, index)"
                            :disabled="!canVote || isEncrypting"
                        />
                        <Label :for="`choice-${vote.id}-${index}`" class="flex-1 cursor-pointer">{{ choice.text }}</Label>
                    </div>
                </RadioGroup>
            </div>

            <div v-if="vote.allowWriteIn" class="space-y-2">
                <div class="p-3 bg-white border border-gray-200 rounded-md">
                    <div class="flex items-center space-x-3 mb-2">
                        <LucideIcon name="Edit3" class="h-4 w-4 text-gray-600" />
                        <Label class="font-medium">Write-in Answer (Optional)</Label>
                    </div>
                    <Input
                        v-model="writeInAnswer"
                        placeholder="Enter your answer"
                        :disabled="!canVote || isEncrypting"
                        class="w-full"
                    />
                </div>
            </div>

            <div class="flex justify-center pt-4">
                <Button
                    type="submit"
                    :disabled="!canVote || !isValidSelection || isEncrypting"
                    class="px-6"
                >
                    <LucideIcon v-if="isEncrypting" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
                    <LucideIcon v-else name="Lock" size="4" class="h-4 w-4 mr-2" />
                    Encrypt Vote
                </Button>
            </div>
            
            <div v-if="!canVote" class="text-center">
                <p class="text-sm text-red-600 font-medium">You are not eligible to vote in this election.</p>
            </div>
        </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
// Reactive state for copy button feedback
const copyStatus = reactive({
    copyBtnVoted: 'idle', // 'idle' | 'copied' | 'error'
    copyBtnEncrypted: 'idle', // 'idle' | 'copied' | 'error'
});

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

// Method to copy text to clipboard
const copyToClipboard = async (text, buttonId) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        copyStatus[buttonId] = 'copied';
        console.log('Hash copied to clipboard:', text);
        // Reset icon after a short delay
        setTimeout(() => {
            copyStatus[buttonId] = 'idle';
        }, 1500);
    } catch (err) {
        console.error('Failed to copy hash:', err);
        copyStatus[buttonId] = 'error'; // Optional: handle error state visually
         setTimeout(() => {
            copyStatus[buttonId] = 'idle';
        }, 1500);
    }
};

// Reset action type when submission stops
watch(() => props.isSubmitting, (newValue) => {
    if (!newValue) {
        actionType.value = null;
    }
});

</script> 