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

// Safe localStorage access for SSR
const getLocalStorage = (key, defaultValue = null) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
};

// Check if user is authenticated
const isAuthenticated = () => {
  // First check for token in localStorage
  const token = getLocalStorage('token')
  const userId = getLocalStorage('userId')
  
  // Log detailed authentication state
  console.log('Auth check:', { 
    hasToken: !!token, 
    hasUserId: !!userId,
    tokenType: typeof token,
    userIdType: typeof userId
  })
  
  // Consider using Session.doesSessionExist() for a more reliable check
  // But since that's async and we need a sync check here, we'll use localStorage
  // Accept either token or userId as proof of authentication
  return !!(token || userId)
}

// Navigation guard to check group membership
router.beforeEach(async (to, from, next) => {
  console.log(`Router guard: navigating from ${from.path} to ${to.path}`)
  
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Log authentication check
    const auth = isAuthenticated()
    console.log(`Router guard: authentication check for ${to.path} - result: ${auth ? 'authenticated' : 'not authenticated'}`)
    
    // Check if user is authenticated
    if (!auth) {
      // Redirect to login page if not authenticated
      console.warn(`Router guard: redirecting to /auth due to failed authentication check for ${to.path}`)
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
        const isMember = Array.isArray(userGroups) && userGroups.some(group => group.id === groupId)
        
        console.log(`Router guard: group membership check for ${groupId} - result: ${isMember ? 'member' : 'not member'}`, 
                    { userGroupsType: typeof userGroups, isArray: Array.isArray(userGroups), groupsCount: Array.isArray(userGroups) ? userGroups.length : 0 })
        
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