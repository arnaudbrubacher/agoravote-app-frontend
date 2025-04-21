import SuperTokens from 'supertokens-web-js'
import Session from 'supertokens-web-js/recipe/session'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'
import EmailVerification from 'supertokens-web-js/recipe/emailverification'
import axios from '~/src/utils/axios' // Import your configured axios instance

export default defineNuxtPlugin(nuxtApp => {
  // Check if running on client side
  if (process.client) {
    console.log('[SuperTokens Plugin] Initializing SuperTokens...');
    
    SuperTokens.init({
      appInfo: {
        // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
        appName: "AgoraVote",
        apiDomain: "http://localhost:8080", // Your backend domain
        websiteDomain: window.location.origin, // Your frontend domain
        apiBasePath: "/auth", // Adjust if your API path is different
        websiteBasePath: "/auth" // Adjust if your website path is different
      },
      recipeList: [
        Session.init({
           onHandleEvent: (context) => {
            console.log("[SuperTokens Session Event]:", context.action, context.sessionContext ? `User ID: ${context.sessionContext.userId}` : '(No Session Context)');
            if (context.action === "UNAUTHORISED") {
              console.warn("SuperTokens session UNAUTHORISED event caught. Consider redirecting to login or showing a message.");
              // Example: nuxtApp.$router.push('/auth'); 
            }
            // Add other event handlers if needed (SESSION_CREATED, SIGN_OUT, etc.)
          },
        }),
        EmailPassword.init(), 
        EmailVerification.init({ mode: 'OPTIONAL' }) // Or 'REQUIRED' based on your backend config
      ]
    });

    console.log('[SuperTokens Plugin] SuperTokens Initialized.');

    // Axios interceptors are typically added automatically by SuperTokens
    // if using a supported library like Axios. If you face issues, 
    // you might manually add them, but it's usually not needed.
    // Session.addAxiosInterceptors(axios);
    // console.log('[SuperTokens Plugin] Axios interceptors check/add.');

  }
}); 