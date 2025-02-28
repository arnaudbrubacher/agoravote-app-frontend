<script setup>
import { provide, ref, readonly } from 'vue'

const open = ref(false)

const setOpen = (value) => {
  open.value = value
}

provide('dropdownOpen', readonly(open))
provide('setDropdownOpen', setOpen)
</script>

<template>
  <div class="relative">
    <slot />
  </div>
</template>