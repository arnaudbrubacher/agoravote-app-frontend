<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-semibold">{{ post.subject }}</h2>
            <p class="text-sm text-muted-foreground">{{ post.date }}</p>
          </div>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="icon" @click="$emit('edit', post)">
              <Icon name="heroicons:pencil" class="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" @click="$emit('delete', post.id)">
              <Icon name="heroicons:trash" class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" @click="$emit('close')">
              <Icon name="heroicons:x-mark" class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p class="whitespace-pre-wrap">{{ post.content }}</p>
        <div v-if="post.file" class="flex items-center space-x-2">
          <Icon name="heroicons:document" class="h-5 w-5" />
          <a :href="post.fileUrl" download class="text-primary hover:underline">
            {{ post.fileName }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'

defineProps(['post'])
defineEmits(['close', 'edit', 'delete'])
</script>