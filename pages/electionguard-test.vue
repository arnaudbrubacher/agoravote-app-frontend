<template>
  <div class="container mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-6">ElectionGuard Development Environment</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <ElectionGuardTest />
      </div>
      
      <div class="space-y-6">
        <div class="p-6 bg-white rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">ElectionGuard Setup</h2>
          
          <p class="text-sm text-muted-foreground mb-4">
            To set up the ElectionGuard development environment, run the setup script:
          </p>
          
          <pre class="bg-gray-100 p-4 rounded text-xs">
bash scripts/setup_electionguard.sh
          </pre>
          
          <p class="text-sm text-muted-foreground mt-4">
            This script will:
          </p>
          
          <ul class="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Install ElectionGuard core library and dependencies</li>
            <li>Configure CGo environment for Go-C++ interoperability</li>
            <li>Set up testing framework for cryptographic operations</li>
            <li>Create frontend utilities for interacting with ElectionGuard</li>
          </ul>
        </div>
        
        <div class="p-6 bg-white rounded-lg shadow-md">
          <h2 class="text-2xl font-bold mb-4">ElectionGuard Documentation</h2>
          
          <p class="text-sm text-muted-foreground mb-4">
            ElectionGuard is an open-source SDK that makes voting more secure, transparent, and accessible.
          </p>
          
          <div class="space-y-2">
            <a 
              href="https://github.com/microsoft/electionguard" 
              target="_blank" 
              class="text-primary hover:underline block"
            >
              ElectionGuard GitHub Repository
            </a>
            
            <a 
              href="https://www.electionguard.vote/" 
              target="_blank" 
              class="text-primary hover:underline block"
            >
              ElectionGuard Official Website
            </a>
            
            <a 
              href="https://github.com/microsoft/electionguard-cpp" 
              target="_blank" 
              class="text-primary hover:underline block"
            >
              ElectionGuard C++ Implementation
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ElectionGuardTest from '~/components/votes/ElectionGuardTest.vue'
</script> 