<template>
  <Button variant="ghost" @click="toggleSidebar" size="icon" class="p-1 h-10 w-10 rounded-md">
    <PanelLeftClose v-if="open" class="h-7 w-7" />
    <PanelLeftOpen v-else class="h-7 w-7" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>

<script setup>
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-vue-next';

const { toggleSidebar, open } = useSidebar();
</script> 