<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'rounded-md p-4 shadow-lg transition-all duration-300 transform translate-x-0',
        getToastClass(toast.type)
      ]"
      role="alert"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component 
            :is="getIcon(toast.type)" 
            class="h-5 w-5" 
            :class="getIconClass(toast.type)" 
            aria-hidden="true"
          />
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium" :class="getTitleClass(toast.type)">
            {{ toast.title }}
          </h3>
          <div class="mt-1 text-sm" :class="getTextClass(toast.type)">
            {{ toast.description }}
          </div>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="getButtonClass(toast.type)"
            @click="dismiss(toast.id)"
          >
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import { h } from 'vue'

const { toasts, dismiss } = useToast()

// Icons for different toast types
const SuccessIcon = () => h('svg', { 
  xmlns: 'http://www.w3.org/2000/svg', 
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    'clip-rule': 'evenodd'
  })
])

const ErrorIcon = () => h('svg', { 
  xmlns: 'http://www.w3.org/2000/svg', 
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
    'clip-rule': 'evenodd'
  })
])

const InfoIcon = () => h('svg', { 
  xmlns: 'http://www.w3.org/2000/svg', 
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z',
    'clip-rule': 'evenodd'
  })
])

const WarningIcon = () => h('svg', { 
  xmlns: 'http://www.w3.org/2000/svg', 
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
    'clip-rule': 'evenodd'
  })
])

const DefaultIcon = () => h('svg', { 
  xmlns: 'http://www.w3.org/2000/svg', 
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z',
    'clip-rule': 'evenodd'
  })
])

// Styling based on toast type
function getToastClass(type) {
  switch (type) {
    case 'success': return 'bg-green-50 border border-green-100';
    case 'error': return 'bg-red-50 border border-red-100';
    case 'warning': return 'bg-yellow-50 border border-yellow-100';
    case 'info': return 'bg-blue-50 border border-blue-100';
    default: return 'bg-gray-50 border border-gray-100';
  }
}

function getTitleClass(type) {
  switch (type) {
    case 'success': return 'text-green-800';
    case 'error': return 'text-red-800';
    case 'warning': return 'text-yellow-800';
    case 'info': return 'text-blue-800';
    default: return 'text-gray-800';
  }
}

function getTextClass(type) {
  switch (type) {
    case 'success': return 'text-green-700';
    case 'error': return 'text-red-700';
    case 'warning': return 'text-yellow-700';
    case 'info': return 'text-blue-700';
    default: return 'text-gray-700';
  }
}

function getIconClass(type) {
  switch (type) {
    case 'success': return 'text-green-400';
    case 'error': return 'text-red-400';
    case 'warning': return 'text-yellow-400';
    case 'info': return 'text-blue-400';
    default: return 'text-gray-400';
  }
}

function getButtonClass(type) {
  switch (type) {
    case 'success': return 'text-green-500 hover:text-green-600';
    case 'error': return 'text-red-500 hover:text-red-600';
    case 'warning': return 'text-yellow-500 hover:text-yellow-600';
    case 'info': return 'text-blue-500 hover:text-blue-600';
    default: return 'text-gray-500 hover:text-gray-600';
  }
}

function getIcon(type) {
  switch (type) {
    case 'success': return SuccessIcon;
    case 'error': return ErrorIcon;
    case 'warning': return WarningIcon;
    case 'info': return InfoIcon;
    default: return DefaultIcon;
  }
}
</script>