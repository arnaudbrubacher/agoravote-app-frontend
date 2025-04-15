<template>
  <div class="space-y-4">
    <div v-if="!results || Object.keys(results.contests || {}).length === 0">
      <p class="text-sm text-muted-foreground">No results available or tally data is empty.</p>
    </div>
    <div v-else>
      <!-- Assuming only one contest per vote for now, adapt if multiple contests are possible -->
      <div v-for="contest in results.contests" :key="contest.object_id" class="space-y-3">
         <h5 class="text-sm font-semibold text-gray-700">Results Breakdown:</h5>
         <!-- Selections Table -->
         <div class="border rounded-md overflow-hidden">
           <table class="min-w-full divide-y divide-gray-200">
             <thead class="bg-gray-50">
               <tr>
                 <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Option
                 </th>
                 <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Votes
                 </th>
                 <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Percentage
                 </th>
               </tr>
             </thead>
             <tbody class="bg-white divide-y divide-gray-200">
               <tr v-for="selection in contest.selections" :key="selection.object_id">
                 <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                   {{ getChoiceText(selection.object_id) }}
                 </td>
                 <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                   {{ selection.tally }}
                 </td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                    {{ calculatePercentage(selection.tally, totalVotesForContest(contest)) }}%
                 </td>
               </tr>
                <!-- TODO: Add row for write-ins if applicable and present in tally -->
             </tbody>
             <tfoot class="bg-gray-50 border-t">
                <tr>
                    <td class="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total</td>
                    <td class="px-4 py-2 text-right text-sm font-semibold text-gray-700">{{ totalVotesForContest(contest) }}</td>
                    <td class="px-4 py-2 text-right text-sm font-semibold text-gray-700">100%</td>
                </tr>
             </tfoot>
           </table>
         </div>

         <!-- Add display for spoiled ballots if available in results -->
         <!--
         <div v-if="results.spoiled_ballots && results.spoiled_ballots.length > 0" class="mt-4">
            <h5 class="text-sm font-semibold text-gray-700">Spoiled Ballots:</h5>
             <pre class="text-xs bg-gray-100 p-2 rounded">{{ JSON.stringify(results.spoiled_ballots, null, 2) }}</pre>
         </div>
         -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  results: { // Parsed PlaintextTally object from the backend
    type: Object,
    required: true
  },
  vote: { // The original vote object to map selection IDs to text
    type: Object,
    required: true
  }
})

// Helper to find the original choice text using the selection object_id
const getChoiceText = (selectionObjectId) => {
  if (!props.vote || !props.vote.choices) {
    return 'Unknown Option';
  }
  // Derive the index from the standard selection ID format "selection-<voteId>-<index+1>"
  const parts = selectionObjectId.split('-');
  if (parts.length < 3) return 'Invalid ID Format';
  const index = parseInt(parts[parts.length - 1], 10) - 1; // Get last part, convert to 0-based index
  
  return props.vote.choices[index]?.text || `Option ${index + 1}`;
};

// Helper to calculate the total votes for a specific contest
const totalVotesForContest = (contest) => {
    if (!contest || !contest.selections) return 0;
    return Object.values(contest.selections).reduce((sum, selection) => sum + (selection.tally || 0), 0);
}

// Helper to calculate percentage
const calculatePercentage = (count, total) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
}

</script> 