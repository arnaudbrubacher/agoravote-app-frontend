<script setup>
import { inject } from 'vue'

const props = defineProps({
  asChild: {
    type: Boolean,
    default: false
  }
})

const open = inject('dropdownOpen')
const setOpen = inject('setDropdownOpen')

const toggle = () => {
  setOpen(!open.value)
}
</script>

<template>
  <div @click="toggle">
    <slot v-if="asChild" />
    <button v-else type="button" class="inline-flex items-center justify-center">
      <slot />
    </button>
  </div>
</template>