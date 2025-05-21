<template>
  <Button variant="ghost" @click="toggleSidebar" size="auto" class="p-2 h-auto rounded-md flex items-center space-x-2">
    <PanelLeftClose v-if="open" class="h-6 w-6" />
    <PanelLeftOpen v-else class="h-6 w-6" />
    <span class="font-semibold text-lg">Agora Vote</span>
  </Button>
</template>

<script setup>
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-vue-next';

const { toggleSidebar, open } = useSidebar();
</script> 