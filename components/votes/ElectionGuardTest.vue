<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">ElectionGuard Test</h2>
    
    <div class="mb-6">
      <p class="text-sm text-muted-foreground mb-2">
        This component tests the ElectionGuard integration by encrypting a sample ballot.
      </p>
      
      <div class="flex items-center space-x-2 mb-4">
        <div class="w-3 h-3 rounded-full" :class="apiAvailable ? 'bg-green-500' : 'bg-red-500'"></div>
        <span>ElectionGuard API: {{ apiAvailable ? 'Available' : 'Unavailable' }}</span>
      </div>
    </div>
    
    <div class="space-y-4">
      <div>
        <Label for="ballotId">Ballot ID</Label>
        <Input id="ballotId" v-model="ballotData.ballot_id" placeholder="Enter ballot ID" />
      </div>
      
      <div>
        <Label for="electionId">Election ID</Label>
        <Input id="electionId" v-model="ballotData.election_id" placeholder="Enter election ID" />
      </div>
      
      <div>
        <Label for="voterId">Voter ID</Label>
        <Input id="voterId" v-model="ballotData.voter_id" placeholder="Enter voter ID" />
      </div>
      
      <div>
        <Label>Selections</Label>
        <div class="space-y-2 mt-2">
          <div v-for="(selection, index) in ballotData.selections" :key="index" class="flex items-center space-x-2">
            <Checkbox 
              :id="`selection-${index}`" 
              v-model:checked="ballotData.selections[index]" 
            />
            <Label :for="`selection-${index}`">Option {{ index + 1 }}</Label>
          </div>
          <Button variant="outline" size="sm" @click="addSelection">
            Add Option
          </Button>
        </div>
      </div>
      
      <div>
        <Label for="publicKey">Public Key</Label>
        <Input id="publicKey" v-model="ballotData.public_key" placeholder="Enter public key" />
      </div>
      
      <div class="flex justify-end space-x-2">
        <Button variant="outline" @click="checkApiAvailability">
          Check API
        </Button>
        <Button @click="encryptBallot" :disabled="isLoading">
          <LucideIcon v-if="isLoading" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
          Encrypt Ballot
        </Button>
      </div>
    </div>
    
    <div v-if="encryptedBallot" class="mt-6 pt-4 border-t">
      <h3 class="font-medium mb-2">Encrypted Ballot</h3>
      <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">{{ JSON.stringify(encryptedBallot, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="mt-4 p-4 bg-red-50 text-red-600 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { encryptBallot as encryptBallotApi, isElectionGuardAvailable } from '~/lib/electionguard'

const apiAvailable = ref(false)
const isLoading = ref(false)
const error = ref(null)
const encryptedBallot = ref(null)

const ballotData = ref({
  ballot_id: 'ballot-' + Math.floor(Math.random() * 1000),
  election_id: 'election-' + Math.floor(Math.random() * 1000),
  voter_id: 'voter-' + Math.floor(Math.random() * 1000),
  selections: [false, false, false],
  public_key: 'test-public-key'
})

const addSelection = () => {
  ballotData.value.selections.push(false)
}

const checkApiAvailability = async () => {
  try {
    isLoading.value = true
    error.value = null
    apiAvailable.value = await isElectionGuardAvailable()
  } catch (err) {
    error.value = `Error checking API: ${err.message}`
    apiAvailable.value = false
  } finally {
    isLoading.value = false
  }
}

const encryptBallot = async () => {
  try {
    isLoading.value = true
    error.value = null
    encryptedBallot.value = await encryptBallotApi(ballotData.value)
  } catch (err) {
    error.value = `Error encrypting ballot: ${err.message}`
    encryptedBallot.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await checkApiAvailability()
})
</script> 