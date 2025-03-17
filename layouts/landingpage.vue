<template>
  <div class="min-h-screen bg-background">
    <!-- Main Content -->
    <main>
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-muted/20">
      <div class="container mx-auto py-10 px-4">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="space-y-4">
            <h3 class="text-lg font-bold">Agora Vote Inc.</h3>
          </div>
          <div class="space-y-4">
            <p class="text-muted-foreground">arnaud_brubacher@hotmail.com</p>
          </div>
          <div class="space-y-4">
            <p class="text-muted-foreground">1 (450) 405-3415</p>
          </div>
        </div>
        <div class="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Agora Vote. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// No imports or functions needed in the layout anymore
</script>