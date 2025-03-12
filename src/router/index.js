import { createRouter, createWebHistory } from 'vue-router'
import Auth from '@/pages/auth.vue'
import axios from '@/utils/axios'

const routes = [
  { path: '/', redirect: '/auth' },
  { path: '/auth', component: Auth },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('@/pages/user/[id].vue'),
    meta: { requiresAuth: true } // Set to false if public access is allowed
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/group/:id',
    name: 'Group',
    component: () => import('@/pages/group/[id].vue'),
    meta: { requiresAuth: true, requiresGroupMembership: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to check group membership
router.beforeEach(async (to, from, next) => {
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      // Redirect to login page if not authenticated
      return next('/auth')
    }
    
    // Check if the route requires group membership
    if (to.matched.some(record => record.meta.requiresGroupMembership)) {
      try {
        // Get the group ID from the route params
        const groupId = to.params.id
        
        // Fetch user's groups
        const response = await axios.get('/user/groups')
        const userGroups = response.data
        
        // Check if the user is a member of this group
        const isMember = userGroups.some(group => group.id === groupId)
        
        if (!isMember) {
          console.log('User is not a member of this group, redirecting to profile')
          return next('/profile')
        }
      } catch (error) {
        console.error('Error checking group membership:', error)
        // If there's an error, redirect to profile as a fallback
        return next('/profile')
      }
    }
  }
  
  // Continue navigation
  next()
})

export default router