<script setup lang="ts">
import { ref } from 'vue'
import { cn } from '@/lib/utils'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  type ScrollAreaRootProps,
  ScrollAreaViewport,
} from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import ScrollBar from './ScrollBar.vue'

const props = defineProps({
  class: {
    type: String,
    default: ''
  },
  maxHeight: {
    type: String,
    default: 'auto'
  }
})

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const viewportRef = ref(null)
</script>

<template>
  <div class="relative overflow-hidden" :class="props.class">
    <div
      ref="viewportRef"
      class="h-full w-full overflow-y-auto"
      :style="{ maxHeight: props.maxHeight || 'auto' }"
    >
      <slot />
    </div>
  </div>
</template>
