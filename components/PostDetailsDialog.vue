<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col h-[90vh]">
        <header class="flex justify-between items-center p-6 border-b">
          <h2 class="text-lg font-semibold">{{ post.title }}</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <XIcon class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="font-medium">{{ post.author }}</span>
                <span class="text-sm text-muted-foreground">{{ post.date }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <Button variant="ghost" size="sm" @click="$emit('edit', post)" class="border">
                  <PencilIcon class="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" @click="$emit('delete', post)" class="border">
                  <TrashIcon class="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
            <p class="whitespace-pre-wrap">{{ post.content }}</p>
          </div>
        </div>

        <footer class="p-6 border-t">
          <div class="flex justify-end">
            <Button @click="$emit('close')">Close</Button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
import { XIcon, PencilIcon, TrashIcon } from '@heroicons/vue/outline'

defineProps({
  post: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'edit', 'delete'])
</script>