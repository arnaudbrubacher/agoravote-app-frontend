<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container flex h-16 items-center px-4">
        <div class="flex w-full items-center">
          <h1 class="text-xl font-bold mx-auto">Agora Vote</h1>
          <Button @click="goToProfile" variant="default" class="absolute right-4">Profile</Button>
        </div>
      </div>
    </header>
    <main class="container mx-auto py-6 px-4">
      <NuxtPage />
    </main>
    <footer class="border-t">
      <div class="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Agora Vote. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui/button'
const router = useRouter()

const goToProfile = () => {
  router.push('/profile')
}
</script>