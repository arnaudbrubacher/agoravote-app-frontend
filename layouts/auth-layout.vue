<template>
  <div class="min-h-screen bg-background flex flex-col">
    <header class="border-b h-16 flex items-center justify-center px-4">
      <h1 class="text-xl font-bold">Agora Vote</h1>
    </header>
    
    <main class="container mx-auto py-12 px-4 flex-grow flex flex-col items-center justify-center">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>
    
    <footer class="border-t mt-auto">
      <div class="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Agora Vote. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Simple auth layout with centered content and no navigation links
</script> 