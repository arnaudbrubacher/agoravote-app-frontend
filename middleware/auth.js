import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import Session from 'supertokens-web-js/recipe/session'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // This middleware should only run on the client-side
  if (process.server) {
    return
  }

  console.log('[Auth Middleware] Running for route:', to.path);

  try {
    const sessionExists = await Session.doesSessionExist();
    console.log('[Auth Middleware] Session exists:', sessionExists);

    if (!sessionExists) {
      console.log('[Auth Middleware] No session found, redirecting to /auth');
      // Redirect to the login page, clearing the intended destination
      // Using { replace: true } prevents adding the auth page to history
      return navigateTo('/auth', { replace: true });
    }
    // If session exists, allow navigation to proceed
     console.log('[Auth Middleware] Session found, allowing access.');
  } catch (error) {
    console.error('[Auth Middleware] Error checking session:', error);
    // Optionally handle the error, e.g., redirect to an error page or login
    // For now, let's redirect to login on error as well for safety
    return navigateTo('/auth', { replace: true });
  }
}); 