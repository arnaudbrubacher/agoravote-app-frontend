<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container flex h-16 items-center px-4">
        <h1 class="text-xl font-bold">Agora Vote</h1>
        <nav class="ml-auto">
          <ul class="flex items-center gap-6">
            <li><NuxtLink to="/" class="hover:text-primary">Home</NuxtLink></li>
            <li><NuxtLink to="/about" class="hover:text-primary">About</NuxtLink></li>
            <li><NuxtLink to="/contact" class="hover:text-primary">Contact</NuxtLink></li>
            <li><Button @click="openApp" variant="default">Open App</Button></li>
          </ul>
        </nav>
      </div>
    </header>
    <main class="container mx-auto py-6 px-4">
      <NuxtPage />
    </main>
    <footer class="border-t">
      <div class="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2023 Agora Vote. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
const router = useRouter()

const openApp = () => {
  router.push('/auth')
}
</script>