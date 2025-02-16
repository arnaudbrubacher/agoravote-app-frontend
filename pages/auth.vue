<template>
  <div class="mx-auto max-w-md space-y-6">
    <div class="space-y-2 text-center">
    </div>
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Signup</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleLogin" class="space-y-4">
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" v-model="loginEmail" type="email" placeholder="m@example.com" />
              </div>
              <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input id="password" v-model="loginPassword" type="password" />
              </div>
              <Button type="submit" class="w-full">Login</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register">
        <Card>
          <CardHeader>
            <CardTitle>Signup</CardTitle>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleSignup" class="space-y-4">
              <div class="space-y-2">
                <Label for="name">Name</Label>
                <Input id="name" v-model="signupName" />
              </div>
              <div class="space-y-2">
                <Label for="signup-email">Email</Label>
                <Input id="signup-email" v-model="signupEmail" type="email" placeholder="m@example.com" />
              </div>
              <div class="space-y-2">
                <Label for="signup-password">Password</Label>
                <Input id="signup-password" v-model="signupPassword" type="password" />
              </div>
              <div class="space-y-2">
                <Label for="signup-password-confirm">Confirm Password</Label>
                <Input 
                  id="signup-password-confirm" 
                  v-model="signupPasswordConfirm" 
                  type="password"
                  :class="{ 'border-red-500': passwordError }"
                />
                <p v-if="passwordError" class="text-sm text-red-500">Passwords do not match</p>
              </div>
              <Button type="submit" class="w-full">Create Account</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth-layout'
})

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const router = useRouter()
const activeTab = ref('login')
const loginEmail = ref('')
const loginPassword = ref('')
const signupName = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')
const passwordError = ref(false)

const handleLogin = () => {
  console.log('Login:', { email: loginEmail.value, password: loginPassword.value })
  // Simulate successful login
  router.push('/dashboard')
}

const handleSignup = () => {
  if (signupPassword.value !== signupPasswordConfirm.value) {
    passwordError.value = true
    return
  }
  passwordError.value = false
  console.log('Signup:', {
    name: signupName.value,
    email: signupEmail.value,
    password: signupPassword.value
  })
  // Simulate successful signup
  router.push('/dashboard')
}
</script>

<style>
/* Your styles here */
</style>