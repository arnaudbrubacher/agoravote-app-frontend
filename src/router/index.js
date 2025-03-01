import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/dashboard.vue'
import Auth from '@/pages/auth.vue'

const routes = [
  { path: '/', redirect: '/auth' },
  { path: '/auth', component: Auth },
  { path: '/dashboard', component: Dashboard },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('@/pages/user/[id].vue'),
    meta: { requiresAuth: true } // Set to false if public access is allowed
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router