import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import SuperTokens from 'supertokens-web-js'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'
import Session, { addAxiosInterceptors } from 'supertokens-web-js/recipe/session'
import axios from './utils/axios'

// Initialize SuperTokens before anything else
if (typeof window !== 'undefined') {
  SuperTokens.init({
    appInfo: {
      appName: "AgoraVote",
      apiDomain: "http://localhost:8080",
      apiBasePath: "/auth",
    },
    recipeList: [
      EmailPassword.init(),
      Session.init()
    ]
  })
  addAxiosInterceptors(axios)
}

createApp(App)
  .use(router)
  .mount('#app')